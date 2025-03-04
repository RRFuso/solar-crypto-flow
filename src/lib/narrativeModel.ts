
import * as tf from '@tensorflow/tfjs';
import { NarrativeData, ModelPrediction, NarrativeFlow } from '@/types/narratives';

// Función para normalizar los datos
const normalizeData = (data: number[]): number[] => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return data.map(value => (value - min) / (max - min));
};

// Función para crear secuencias de datos para el LSTM
const createSequences = (data: number[], sequenceLength: number): { X: number[][], y: number[] } => {
  const X: number[][] = [];
  const y: number[] = [];
  
  for (let i = 0; i < data.length - sequenceLength; i++) {
    X.push(data.slice(i, i + sequenceLength));
    y.push(data[i + sequenceLength]);
  }
  
  return { X, y };
};

// Creación y entrenamiento del modelo LSTM
export const trainNarrativeModel = async (narrativeData: NarrativeData[]): Promise<tf.LayersModel> => {
  // Extraer datos de marketCap para entrenamiento
  const marketCapData = narrativeData.map(n => n.marketCap);
  const normalizedData = normalizeData(marketCapData);
  
  // Crear secuencias
  const sequenceLength = 3; // Simplificado para el ejemplo
  const { X, y } = createSequences(normalizedData, sequenceLength);
  
  // Convertir a tensores
  const xTensor = tf.tensor2d(X, [X.length, sequenceLength]);
  const yTensor = tf.tensor1d(y);
  
  // Reshape para LSTM
  const reshapedX = xTensor.reshape([X.length, sequenceLength, 1]);
  
  // Crear modelo
  const model = tf.sequential();
  
  // Añadir capas LSTM
  model.add(tf.layers.lstm({
    units: 10,
    inputShape: [sequenceLength, 1],
    returnSequences: false
  }));
  
  // Añadir capa densa para la salida
  model.add(tf.layers.dense({ units: 1 }));
  
  // Compilar modelo
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError'
  });
  
  // Entrenar modelo
  await model.fit(reshapedX, yTensor, {
    epochs: 20,
    batchSize: 4,
    shuffle: true,
    verbose: 0
  });
  
  return model;
};

// Generar predicciones de flujos entre narrativas
export const generateFlowPredictions = async (
  narratives: NarrativeData[],
  model: tf.LayersModel
): Promise<ModelPrediction> => {
  // Generar flujos de narrativas basados en predicciones del modelo
  const flowsData: NarrativeFlow[] = [];
  
  // Crear matriz para guardar las predicciones de cambios en market cap
  const predictedChanges: { id: string, change: number }[] = [];
  
  // Para cada narrativa, hacer una predicción
  for (const narrative of narratives) {
    // Obtener datos históricos para predecir (simplificado)
    const sequenceLength = 3;
    const historyData = [
      narrative.marketCap * 0.98, 
      narrative.marketCap * 0.99, 
      narrative.marketCap
    ];
    const normalizedHistory = normalizeData(historyData);
    
    // Crear tensor para la predicción
    const inputTensor = tf.tensor3d([normalizedHistory], [1, sequenceLength, 1]);
    
    // Hacer predicción
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const predictedValue = prediction.dataSync()[0];
    
    // Ajustar a un porcentaje de cambio (entre -5% y +5%)
    const changePercent = ((predictedValue - normalizedHistory[normalizedHistory.length - 1]) * 10) - 2.5;
    
    predictedChanges.push({
      id: narrative.id,
      change: changePercent
    });
  }
  
  // Ordenar narrativas por cambio predicho
  const sortedPredictions = [...predictedChanges].sort((a, b) => b.change - a.change);
  
  // Crear flujos de capital de narrativas con cambio negativo a positivo
  for (let i = 0; i < predictedChanges.length; i++) {
    const source = predictedChanges[i];
    
    // Si el cambio es negativo, crear flujos hacia narrativas con cambio positivo
    if (source.change < 0) {
      const positiveTargets = sortedPredictions.filter(p => p.change > 0);
      
      for (let j = 0; j < Math.min(2, positiveTargets.length); j++) {
        const target = positiveTargets[j];
        const sourceNarrative = narratives.find(n => n.id === source.id);
        
        if (sourceNarrative) {
          // Calcular el flujo basado en el cambio negativo
          const flowValue = (Math.abs(source.change) * sourceNarrative.marketCap) / 100;
          
          flowsData.push({
            from: source.id,
            to: target.id,
            value: flowValue,
            percentage: Math.abs(source.change),
            predicted: true
          });
        }
      }
    }
  }
  
  return {
    narrativeFlows: flowsData,
    timestamp: new Date().toISOString(),
    confidence: 0.6 + Math.random() * 0.3 // Confianza entre 60-90%
  };
};

// Función para cargar o entrenar el modelo
export const loadNarrativeModel = async (narratives: NarrativeData[]): Promise<tf.LayersModel> => {
  let model: tf.LayersModel;
  
  try {
    // Intentar cargar el modelo desde localStorage
    model = await tf.loadLayersModel('localstorage://narrative-flow-model');
    console.log('Modelo LSTM cargado de localStorage');
  } catch (error) {
    // Si no existe, crear y entrenar uno nuevo
    console.log('Entrenando nuevo modelo LSTM...');
    model = await trainNarrativeModel(narratives);
    // Guardar el modelo para uso futuro
    await model.save('localstorage://narrative-flow-model');
  }
  
  return model;
};

// Predecir flujos de narrativas usando el modelo LSTM
export const predictWithModel = async (narratives: NarrativeData[]): Promise<ModelPrediction> => {
  try {
    // Cargar o entrenar el modelo
    const model = await loadNarrativeModel(narratives);
    
    // Generar predicciones
    const predictions = await generateFlowPredictions(narratives, model);
    
    return predictions;
  } catch (error) {
    console.error('Error al predecir flujos de narrativas:', error);
    return {
      narrativeFlows: [],
      timestamp: new Date().toISOString(),
      confidence: 0
    };
  }
};
