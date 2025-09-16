import React from 'react';
import Shell from '@/components/admin/Shell';
import { Card, Table, Space, Button, Input, message, Typography } from 'antd';
import { apiGet, apiPost } from '@/lib/admin/api';
import { useAdminToken } from '@/lib/admin/useAdminToken';
import { toCsv, downloadText } from '@/lib/admin/csv';

export default function AdminTokensPage() {
  const { token } = useAdminToken();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [limit, setLimit] = React.useState('500');
  const [q, setQ] = React.useState('');
  const [selected, setSelected] = React.useState<React.Key[]>([]);

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

  const data = React.useMemo(() => {
    const rows = (result?.tokens || []) as Array<{ symbol: string; name: string; decimals: number; address: string }>;
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter(r => r.symbol.toLowerCase().includes(s) || r.name.toLowerCase().includes(s) || r.address.toLowerCase().includes(s));
  }, [result, q]);

  const columns = [
    { title: '#', key: 'index', width: 60, render: (_: any, __: any, index: number) => index + 1 },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol', sorter: (a: any, b: any) => String(a.symbol).localeCompare(String(b.symbol)) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: any, b: any) => String(a.name).localeCompare(String(b.name)) },
    { title: 'Decimals', dataIndex: 'decimals', key: 'decimals', width: 100, sorter: (a: any, b: any) => Number(a.decimals) - Number(b.decimals) },
    { title: 'Address', dataIndex: 'address', key: 'address', render: (v: string) => <Typography.Text copyable={{ text: v }}><code>{v}</code></Typography.Text> },
  ];

  const onExportAll = () => {
    const csv = toCsv(data, ['symbol', 'name', 'decimals', 'address']);
    downloadText('tokens.csv', csv);
  };

  const onExportSelected = () => {
    const rows = (data as any[]).filter(r => selected.includes(r.address));
    const csv = toCsv(rows, ['symbol', 'name', 'decimals', 'address']);
    downloadText('tokens_selected.csv', csv);
  };

  return (
    <Shell>
      <Card title="Tokens" extra={(
        <Space wrap>
          <Input placeholder="Filter (symbol/name/address)" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
          <Input style={{ width: 100 }} value={limit} onChange={(e) => setLimit(e.target.value)} />
          <Button onClick={load}>Reload</Button>
          <Button onClick={onExportAll}>Export CSV</Button>
          <Button disabled={selected.length === 0} onClick={onExportSelected}>Export selected</Button>
          <Button type="primary" onClick={refresh}>Refresh catalog</Button>
        </Space>
      )} loading={loading}>
        {result && (
          <>
            <div style={{ marginBottom: 8, color: '#999' }}>Updated: {result.updatedAt || 'unknown'} · Chain: {result.chainId} · Count: {result.count}</div>
            <Table
              rowKey={(r) => (r as any).address}
              dataSource={data}
              columns={columns}
              size="small"
              rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
              pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}
