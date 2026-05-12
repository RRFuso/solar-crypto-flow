import * as tf from '@tensorflow/tfjs';

/**
 * DataPreprocessor — utilitários para preparar séries temporais para modelos ML.
 * Não usa danfo/math para manter o bundle leve; apenas TensorFlow.js.
 */
export class DataPreprocessor {
  /** Normaliza para [0, 1] usando min-max. */
  static normalize(data: number[]): { normalized: number[]; min: number; max: number } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const normalized = data.map((v) => (v - min) / range);
    return { normalized, min, max };
  }

  /** Inverte normalize(). */
  static denormalize(normalized: number[], min: number, max: number): number[] {
    const range = max - min || 1;
    return normalized.map((v) => v * range + min);
  }

  /**
   * Cria janelas deslizantes (X) e o próximo valor (y) para LSTM.
   */
  static createSequences(
    data: number[],
    lookback = 60
  ): { X: number[][]; y: number[] } {
    const X: number[][] = [];
    const y: number[] = [];
    for (let i = lookback; i < data.length; i++) {
      X.push(data.slice(i - lookback, i));
      y.push(data[i]);
    }
    return { X, y };
  }

  /** Split temporal (sem shuffle). */
  static trainTestSplit(
    X: number[][],
    y: number[],
    trainRatio = 0.7,
    valRatio = 0.15
  ) {
    const total = X.length;
    const trainSize = Math.floor(total * trainRatio);
    const valSize = Math.floor(total * valRatio);
    return {
      X_train: X.slice(0, trainSize),
      y_train: y.slice(0, trainSize),
      X_val: X.slice(trainSize, trainSize + valSize),
      y_val: y.slice(trainSize, trainSize + valSize),
      X_test: X.slice(trainSize + valSize),
      y_test: y.slice(trainSize + valSize),
    };
  }

  /** Adiciona features técnicas básicas (SMA10, SMA20, vol, momentum, posição relativa). */
  static addTechnicalFeatures(prices: number[]): number[][] {
    const features: number[][] = [];
    for (let i = 20; i < prices.length; i++) {
      const slice = prices.slice(i - 20, i + 1);
      const currentPrice = slice[slice.length - 1];
      const sma10 = slice.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const sma20 = slice.reduce((a, b) => a + b, 0) / 20;
      const variance =
        slice.reduce((s, v) => s + Math.pow(v - sma20, 2), 0) / 20;
      const volatility = Math.sqrt(variance);
      const momentum = (currentPrice - slice[0]) / (slice[0] || 1);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const relativePosition = (currentPrice - min) / ((max - min) || 1);
      features.push([currentPrice, sma10, sma20, volatility, momentum, relativePosition]);
    }
    return features;
  }

  static toTensor(data: number[][] | number[]): tf.Tensor {
    return tf.tensor(data as number[]);
  }

  static reshapeForLSTM(X: number[][], timesteps: number, features = 1): tf.Tensor3D {
    return tf.tensor3d(X, [X.length, timesteps, features]);
  }
}
