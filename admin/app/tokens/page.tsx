"use client";
import React from 'react';
import Shell from '../../src/components/Shell';
import { Card, Table, Space, Button, Input, message } from 'antd';
import { apiGet, apiPost } from '../../src/lib/api';
import { useAdminToken } from '../../src/lib/useAdminToken';

export default function TokensPage() {
  const { token } = useAdminToken();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [limit, setLimit] = React.useState('500');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit }).toString();
      const data = await apiGet(`/api/admin/tokens/catalog?${qs}`, token);
      setResult(data);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await apiPost(`/api/admin/tokens/refresh`, {}, token);
      setResult(data);
      message.success('Refreshed');
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { if (token) load(); }, [token]);

  const columns = [
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Decimals', dataIndex: 'decimals', key: 'decimals', width: 100 },
    { title: 'Address', dataIndex: 'address', key: 'address', render: (v: string) => <code>{v}</code> },
  ];

  return (
    <Shell>
      <Card title="Tokens" extra={(
        <Space>
          <Input style={{ width: 100 }} value={limit} onChange={(e) => setLimit(e.target.value)} />
          <Button onClick={load}>Reload</Button>
          <Button type="primary" onClick={refresh}>Refresh catalog</Button>
        </Space>
      )} loading={loading}>
        {result && (
          <>
            <div style={{ marginBottom: 8, color: '#999' }}>Updated: {result.updatedAt || 'unknown'} · Chain: {result.chainId} · Count: {result.count}</div>
            <Table
              rowKey={(r) => r.address}
              dataSource={result.tokens || []}
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}
