import { LSTMModel } from './LSTMModel';

/**
 * Ensemble de LSTMs com hiperparâmetros variados.
 * Suporta weighted average, voting de direção e stacking simples.
 */
export class EnsembleModel {
  private models: LSTMModel[] = [];
  private weights: number[] = [];

  async createEnsemble(n = 3) {
    this.models = [];
    this.weights = [];
    for (let i = 0; i < n; i++) {
      const model = new LSTMModel();
      const lookback = 60 + i * 10;
      model.createModel(lookback);
      this.models.push(model);
      this.weights.push(1 / n);
    }
  }

  async trainAll(prices: number[], epochs = 50) {
    // Treina sequencialmente para evitar saturar a GPU/CPU
    for (let i = 0; i < this.models.length; i++) {
      // eslint-disable-next-line no-console
      console.log(`[Ensemble] treinando modelo ${i + 1}/${this.models.length}`);
      await this.models[i].train(prices, epochs);
    }
  }

  async predict(recentPrices: number[], horizon = 1): Promise<number[]> {
    const allPredictions: number[][] = [];
    for (const model of this.models) {
      allPredictions.push(await model.predict(recentPrices, horizon));
    }
    const ensemble: number[] = [];
    const totalWeight = this.weights.reduce((a, b) => a + b, 0) || 1;
    for (let t = 0; t < horizon; t++) {
      let weightedSum = 0;
      for (let i = 0; i < this.models.length; i++) {
        weightedSum += allPredictions[i][t] * this.weights[i];
      }
      ensemble.push(weightedSum / totalWeight);
    }
    return ensemble;
  }

  /** Pesos inversamente proporcionais ao MAE de validação. */
  async optimizeWeights(validationPrices: number[]) {
    const errors: number[] = [];
    for (const model of this.models) {
      const m = await model.evaluate(validationPrices);
      errors.push(m.mae);
    }
    const inverseErrors = errors.map((e) => 1 / (e + 1e-6));
    const sum = inverseErrors.reduce((a, b) => a + b, 0);
    this.weights = inverseErrors.map((ie) => ie / sum);
  }

  async predictDirection(
    recentPrices: number[]
  ): Promise<{ direction: 'up' | 'down'; confidence: number }> {
    const currentPrice = recentPrices[recentPrices.length - 1];
    const predictions: number[] = [];
    for (const model of this.models) {
      const pred = await model.predict(recentPrices, 1);
      predictions.push(pred[0]);
    }
    const upVotes = predictions.filter((p) => p > currentPrice).length;
    const downVotes = this.models.length - upVotes;
    const direction = upVotes > downVotes ? 'up' : 'down';
    const confidence = Math.max(upVotes, downVotes) / this.models.length;
    return { direction, confidence };
  }

  /** Stacking simples — média não ponderada. */
  async stackedPredict(recentPrices: number[], horizon = 1): Promise<number[]> {
    const basePredictions: number[][] = [];
    for (const model of this.models) {
      basePredictions.push(await model.predict(recentPrices, horizon));
    }
    const stacked: number[] = [];
    for (let t = 0; t < horizon; t++) {
      const values = basePredictions.map((p) => p[t]);
      stacked.push(values.reduce((a, b) => a + b, 0) / values.length);
    }
    return stacked;
  }

  async save(basePath = 'indexeddb://ensemble') {
    for (let i = 0; i < this.models.length; i++) {
      await this.models[i].save(`${basePath}-model-${i}`);
    }
    try {
      localStorage.setItem(`${basePath}::weights`, JSON.stringify(this.weights));
    } catch {/* noop */}
  }

  async load(basePath = 'indexeddb://ensemble', n = 3) {
    this.models = [];
    for (let i = 0; i < n; i++) {
      const model = new LSTMModel();
      await model.load(`${basePath}-model-${i}`);
      this.models.push(model);
    }
    try {
      const raw = localStorage.getItem(`${basePath}::weights`);
      this.weights = raw ? JSON.parse(raw) : Array(n).fill(1 / n);
    } catch {
      this.weights = Array(n).fill(1 / n);
    }
  }
}
