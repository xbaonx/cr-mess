"use client";
import React from 'react';
import Shell from '../../src/components/Shell';
import { Card, Switch, Button, Space, message } from 'antd';
import { apiGet, apiPost } from '../../src/lib/api';
import { useAdminToken } from '../../src/lib/useAdminToken';

export default function FeaturesPage() {
  const { token } = useAdminToken();
  const [loading, setLoading] = React.useState(false);
  const [features, setFeatures] = React.useState<any>({ enableBuy: true, enableSwap: true, maintenanceMode: false });

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/admin/features', token);
      setFeatures(data);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setLoading(true);
    try {
      const data = await apiPost('/api/admin/features', features, token);
      setFeatures(data);
      message.success('Saved');
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { if (token) load(); }, [token]);

  return (
    <Shell>
      <Card title="Feature Flags" loading={loading}>
        <Space direction="vertical" size="large">
          <Space>
            <Switch checked={!!features.enableBuy} onChange={(v) => setFeatures((f:any) => ({ ...f, enableBuy: v }))} />
            <span>Enable Buy</span>
          </Space>
          <Space>
            <Switch checked={!!features.enableSwap} onChange={(v) => setFeatures((f:any) => ({ ...f, enableSwap: v }))} />
            <span>Enable Swap</span>
          </Space>
          <Space>
            <Switch checked={!!features.maintenanceMode} onChange={(v) => setFeatures((f:any) => ({ ...f, maintenanceMode: v }))} />
            <span>Maintenance Mode</span>
          </Space>
          <Space>
            <Button onClick={load}>Reload</Button>
            <Button type="primary" onClick={save}>Save</Button>
          </Space>
        </Space>
      </Card>
    </Shell>
  );
}
