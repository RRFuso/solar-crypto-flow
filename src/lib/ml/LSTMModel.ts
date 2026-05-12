import * as tf from '@tensorflow/tfjs';
import { DataPreprocessor } from './DataPreprocessor';

export interface PredictionWithUncertainty {
  predictions: number[];
  lower: number[];
  upper: number[];
  std: number[];
}

export interface ModelMetrics {
  actual: number;
  predicted: number;
  error: number;
  percentError: number;
  mae: number;
  mse: number;
  rmse: number;
}

/**
 * LSTM para forecasting de preços.
 * Arquitetura: 2 camadas LSTM (50 unidades) + dropout + dense relu + linear.
 */
export class LSTMModel {
  private model: tf.LayersModel | null = null;
  private scalerMin = 0;
  private scalerMax = 1;
  private lookback = 60;

  createModel(lookback = 60, features = 1): tf.LayersModel {
    this.lookback = lookback;
    const model = tf.sequential();
    model.add(
      tf.layers.lstm({
        units: 50,
        returnSequences: true,
        inputShape: [lookback, features],
        dropout: 0.2,
        recurrentDropout: 0.2,
      })
    );
    model.add(
      tf.layers.lstm({
        units: 50,
        returnSequences: false,
        dropout: 0.2,
        recurrentDropout: 0.2,
      })
    );
    model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    this.model = model;
    return model;
  }

  async train(
    prices: number[],
    epochs = 50,
    batchSize = 32,
    validationSplit = 0.15
  ): Promise<tf.History> {
    if (!this.model) this.createModel(this.lookback);

    const { normalized, min, max } = DataPreprocessor.normalize(prices);
    this.scalerMin = min;
    this.scalerMax = max;

    const { X, y } = DataPreprocessor.createSequences(normalized, this.lookback);
    const X_tensor = DataPreprocessor.reshapeForLSTM(X, this.lookback, 1);
    const y_tensor = tf.tensor2d(y, [y.length, 1]);

    const history = await this.model!.fit(X_tensor, y_tensor, {
      epochs,
      batchSize,
      validationSplit,
      shuffle: false,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          const loss = logs?.loss as number | undefined;
          const val = logs?.val_loss as number | undefined;
          // eslint-disable-next-line no-console
          console.log(
            `[LSTM] Epoch ${epoch + 1}: loss=${loss?.toFixed(4)} val_loss=${val?.toFixed(4) ?? 'n/a'}`
          );
        },
      },
    });

    X_tensor.dispose();
    y_tensor.dispose();
    return history;
  }

  async predict(recentPrices: number[], horizon = 1): Promise<number[]> {
    if (!this.model) throw new Error('Modelo não treinado');
    if (recentPrices.length < this.lookback) {
      throw new Error(`Precisa de pelo menos ${this.lookback} valores`);
    }

    const min = this.scalerMin;
    const max = this.scalerMax;
    const range = max - min || 1;
    const normalized = recentPrices.map((v) => (v - min) / range);

    let currentSequence = normalized.slice(-this.lookback);
    const predictions: number[] = [];

    for (let i = 0; i < horizon; i++) {
      const inputTensor = tf.tensor3d([currentSequence], [1, this.lookback, 1]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const predictedValue = (await prediction.data())[0];
      predictions.push(predictedValue);
      currentSequence = [...currentSequence.slice(1), predictedValue];
      inputTensor.dispose();
      prediction.dispose();
    }

    return DataPreprocessor.denormalize(predictions, min, max);
  }

  async predictWithUncertainty(
    recentPrices: number[],
    horizon = 1,
    nSamples = 100
  ): Promise<PredictionWithUncertainty> {
    const allPredictions: number[][] = [];
    for (let i = 0; i < nSamples; i++) {
      allPredictions.push(await this.predict(recentPrices, horizon));
    }

    const mean: number[] = [];
    const std: number[] = [];
    const lower: number[] = [];
    const upper: number[] = [];

    for (let t = 0; t < horizon; t++) {
      const values = allPredictions.map((p) => p[t]);
      const m = values.reduce((a, b) => a + b, 0) / nSamples;
      const variance = values.reduce((s, v) => s + Math.pow(v - m, 2), 0) / nSamples;
      const s = Math.sqrt(variance);
      mean.push(m);
      std.push(s);
      lower.push(m - 1.96 * s);
      upper.push(m + 1.96 * s);
    }

    return { predictions: mean, lower, upper, std };
  }

  async evaluate(testPrices: number[]): Promise<ModelMetrics> {
    const predictions = await this.predict(testPrices.slice(0, -1), 1);
    const actual = testPrices[testPrices.length - 1];
    const predicted = predictions[0];
    const error = actual - predicted;
    const percentError = (error / actual) * 100;
    const mae = Math.abs(error);
    const mse = error * error;
    return { actual, predicted, error, percentError, mae, mse, rmse: Math.sqrt(mse) };
  }

  async save(path = 'indexeddb://lstm-model') {
    if (!this.model) throw new Error('Nenhum modelo para salvar');
    await this.model.save(path);
    // Persistir scaler
    try {
      localStorage.setItem(
        `${path}::scaler`,
        JSON.stringify({ min: this.scalerMin, max: this.scalerMax, lookback: this.lookback })
      );
    } catch {/* noop */}
  }

  async load(path = 'indexeddb://lstm-model') {
    this.model = await tf.loadLayersModel(path);
    try {
      const raw = localStorage.getItem(`${path}::scaler`);
      if (raw) {
        const s = JSON.parse(raw);
        this.scalerMin = s.min;
        this.scalerMax = s.max;
        this.lookback = s.lookback ?? this.lookback;
      }
    } catch {/* noop */}
  }
}
