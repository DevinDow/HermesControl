import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { HERMES_ROOT } from '../../lib/paths';

export async function GET() {
  try {
    // Load config.yaml from the configured Hermes root directory
    const configPath = path.join(HERMES_ROOT, 'config.yaml');
    const configData = await fs.readFile(configPath, 'utf-8');
    const hermesConfig = yaml.load(configData);

    // Extract model configuration
    const modelConfig = hermesConfig.model;
    
    if (!modelConfig) {
      return NextResponse.json(
        { error: 'No model configuration found in config.yaml' },
        { status: 400 }
      );
    }

    // Extract host from base_url domain
    let host = '';
    if (modelConfig.base_url) {
      try {
        const url = new URL(modelConfig.base_url);
        host = url.hostname;
      } catch (e) {
        host = modelConfig.base_url;
      }
    }

    // Extract provider and model from default (format: "provider/model")
    let provider = '';
    let model = '';
    if (modelConfig.default) {
      const parts = modelConfig.default.split('/');
      if (parts.length >= 2) {
        provider = parts[0];
        model = parts.slice(1).join('/'); // Handle models with slashes
      } else {
        model = modelConfig.default;
      }
    }

    // Use provider from split default, fallback to provider field if needed
    if (!provider && modelConfig.provider) {
      provider = modelConfig.provider;
    }

    const modelData = {
      host: host,
      provider: provider,
      model: model,
      baseUrl: modelConfig.base_url,
      apiMode: modelConfig.api_mode,
      default: modelConfig.default
    };

    return NextResponse.json(modelData);
  } catch (error) {
    const configPath = path.join(HERMES_ROOT, 'config.yaml');
    console.error('Failed to fetch model data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to load model data',
        details: errorMessage,
        configPath: configPath
      },
      { status: 500 }
    );
  }
}
