import { useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { ConfigServiceInterface } from '../../services/interfaces/ConfigServiceInterface';

interface ConfigTabProps {
  configService: Inject<ConfigServiceInterface>;
}

export function ConfigTab({ configService }: ConfigTabProps) {
  const { config, isLoading } = configService.state;

  useEffect(() => {
    configService.loadConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="loading-spinner">
        <p>No configuration data available</p>
      </div>
    );
  }

  return (
    <div>
      <h3>⚙️ TDI2 Server Configuration</h3>
      
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>📁 Source Configuration</h4>
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Source Path:</strong> <code>{config.srcPath || 'Not specified'}</code>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Port:</strong> {config.port || 'Not specified'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Verbose Mode:</strong> {config.verbose ? '✅ Enabled' : '❌ Disabled'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>File Watching:</strong> {config.watch ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>
      </div>

      <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>🕐 Runtime Information</h4>
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Server Started:</strong> {config.timestamp || 'Unknown'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Configuration Loaded:</strong> {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>🔧 Actions</h4>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button className="btn" onClick={() => configService.reloadConfig()}>
            🔄 Reload Config
          </button>
        </div>
      </div>

      <div style={{ background: '#fff3e0', border: '1px solid #ffcc02', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h4>💡 Expected Config Locations</h4>
        <p style={{ marginBottom: '10px' }}>TDI2 looks for configuration files in these locations:</p>
        <ul style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
          <li>{config.srcPath}/.tdi2/di-config.ts</li>
          <li>{config.srcPath}/.tdi2/di-config.js</li>
          <li>{config.srcPath}/di-config.ts</li>
          <li>{config.srcPath}/di-config.js</li>
        </ul>
      </div>
    </div>
  );
}