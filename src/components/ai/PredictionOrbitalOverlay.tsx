
import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Prediction } from '@/lib/aiModel';
import { CryptoData } from '@/types/crypto';
import { fetchCryptoData, fetchCapitalFlows } from '@/lib/dataFetcher';
import { extractFeatures } from '@/lib/featureExtractor';
import { predictPriceMovements, getCachedPrediction, storePrediction } from '@/lib/aiModel';
import { getCryptoLogoUrl } from '@/lib/cryptoLogos';

interface PredictionOrbitalOverlayProps {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: any[];
  updateInterval?: number;
}

export const PredictionOrbitalOverlay: React.FC<PredictionOrbitalOverlayProps> = ({ 
  svg, 
  nodes, 
  updateInterval = 600000 // Default: 10 minutes
}) => {
  const [predictions, setPredictions] = useState<Map<string, Prediction>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch and process predictions
  const updatePredictions = useCallback(async () => {
    if (isLoading || !nodes.length) return;
    
    setIsLoading(true);
    try {
      // Get existing node symbols from the visualization
      const symbols = nodes.map(node => node.id);
      
      // Check cache first for each symbol
      const cachedPredictions = new Map<string, Prediction>();
      const symbolsToFetch: string[] = [];
      
      symbols.forEach(symbol => {
        const cached = getCachedPrediction(symbol);
        if (cached) {
          cachedPredictions.set(symbol, cached);
        } else {
          symbolsToFetch.push(symbol);
        }
      });
      
      // If we need to fetch new predictions
      if (symbolsToFetch.length > 0) {
        // Fetch fresh crypto data and flows
        const cryptoData = await fetchCryptoData();
        const relevantCryptos = cryptoData.filter(
          crypto => symbolsToFetch.includes(crypto.symbol)
        );
        
        if (relevantCryptos.length > 0) {
          const flowData = await fetchCapitalFlows(relevantCryptos);
          
          // Extract features and make predictions
          const features = await extractFeatures(relevantCryptos, flowData);
          const newPredictions = predictPriceMovements(features);
          
          // Cache predictions
          newPredictions.forEach(prediction => {
            storePrediction(prediction);
            cachedPredictions.set(prediction.symbol, prediction);
          });
        }
      }
      
      setPredictions(cachedPredictions);
    } catch (error) {
      console.error("Error updating predictions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, isLoading]);
  
  // Initial prediction calculation
  useEffect(() => {
    updatePredictions();
  }, [updatePredictions]);
  
  // Set up periodic updates
  useEffect(() => {
    const interval = setInterval(updatePredictions, updateInterval);
    return () => clearInterval(interval);
  }, [updatePredictions, updateInterval]);

  // Apply visual effects based on predictions
  useEffect(() => {
    if (!svg || predictions.size === 0) return;
    
    // Remove existing overlays
    svg.selectAll(".prediction-overlay").remove();
    svg.selectAll(".prediction-pulse").remove();
    
    // Create group for prediction overlays
    const overlayGroup = svg.append("g").attr("class", "prediction-overlay");
    
    // Find all nodes in the visualization
    const nodeElements = svg.selectAll(".node");
    
    // Add visual indicators to nodes with predictions
    nodeElements.each(function(d: any) {
      const node = d3.select(this);
      const prediction = predictions.get(d.id);
      
      if (prediction) {
        const color = prediction.bullish 
          ? `rgba(0, 255, 128, ${prediction.confidence * 0.7})` 
          : `rgba(255, 50, 50, ${prediction.confidence * 0.7})`;
        
        // Add pulsing effect based on prediction
        if (prediction.confidence > 0.6) {
          const pulse = overlayGroup.append("circle")
            .attr("class", "prediction-pulse")
            .attr("cx", d.x)
            .attr("cy", d.y)
            .attr("r", d.radius * 1.2)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("opacity", 0.7)
            .attr("pointer-events", "none");
            
          // Add pulsing animation
          pulse.append("animate")
            .attr("attributeName", "r")
            .attr("values", `${d.radius * 1.2};${d.radius * 1.8};${d.radius * 1.2}`)
            .attr("dur", prediction.bullish ? "3s" : "4s")
            .attr("repeatCount", "indefinite");
            
          pulse.append("animate")
            .attr("attributeName", "opacity")
            .attr("values", "0.7;0.3;0.7")
            .attr("dur", prediction.bullish ? "3s" : "4s")
            .attr("repeatCount", "indefinite");
        }
        
        // Add tooltip with prediction info
        node.on("mouseover", function(event) {
          const tooltip = d3.select("body").append("div")
            .attr("class", "prediction-tooltip")
            .style("position", "absolute")
            .style("background-color", "rgba(20, 20, 35, 0.9)")
            .style("border", "1px solid" + (prediction.bullish ? "#00ff80" : "#ff3232"))
            .style("border-radius", "6px")
            .style("padding", "12px")
            .style("color", "white")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)")
            .style("z-index", "1000")
            .style("pointer-events", "none")
            .style("transition", "opacity 0.3s")
            .style("opacity", "0")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
            
          // Add logo and information to tooltip
          const logoUrl = getCryptoLogoUrl(d.id);
          
          tooltip.html(`
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <img src="${logoUrl}" width="24" height="24" style="margin-right: 8px; border-radius: 50%;" 
                onerror="this.onerror=null; this.src='https://s3-symbol-logo.tradingview.com/crypto/XTVCUSDT.svg';">
              <span style="font-weight: bold;">${d.id}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="color: ${prediction.bullish ? '#00ff80' : '#ff3232'}; font-weight: bold;">
                ${prediction.bullish ? '🚀 Bullish' : '🔻 Bearish'} (${Math.round(prediction.confidence * 100)}% confidence)
              </span>
            </div>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">Key factors:</div>
            <ul style="margin: 4px 0 0 0; padding-left: 16px;">
              ${prediction.factors.map(factor => `<li>${factor}</li>`).join('')}
            </ul>
          `);
          
          setTimeout(() => tooltip.style("opacity", "1"), 10);
        })
        .on("mousemove", function(event) {
          d3.select(".prediction-tooltip")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function() {
          d3.select(".prediction-tooltip").remove();
        });
      }
    });
    
    // Return cleanup function
    return () => {
      svg.selectAll(".prediction-overlay").remove();
      svg.selectAll(".prediction-pulse").remove();
    };
  }, [svg, predictions]);

  return null; // This is a non-visual overlay component
};

export default PredictionOrbitalOverlay;
