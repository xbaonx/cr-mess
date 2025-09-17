"use client";
import React from 'react';
import Shell from '@/components/admin/Shell';
import { Card, Space, Input, Button, Table, message, Tag } from 'antd';
import { apiGet, apiPost } from '@/lib/admin/api';
import { useAdminToken } from '@/lib/admin/useAdminToken';

type Row = { wallet: string; chainId: string; token: string; amount: string };

function flattenLedger(payload: any): Row[] {
  const rows: Row[] = [];
  if (!payload) return rows;
  const root = payload.ledger ? payload.ledger : (payload.credits ? { [payload.wallet]: { ...(payload.credits || {}) } } : {});
  for (const wallet of Object.keys(root)) {
    const perChain = root[wallet] || {};
    for (const chainId of Object.keys(perChain)) {
      const tokens = perChain[chainId] || {};
      for (const token of Object.keys(tokens)) {
        rows.push({ wallet, chainId, token, amount: String(tokens[token] || '0') });
      }
    }
  }
  return rows;
}

export default function ReferralClient() {
  const { token } = useAdminToken();
  const [loading, setLoading] = React.useState(false);
  const [wallet, setWallet] = React.useState('');
  const [tok, setTok] = React.useState('');
  const [rows, setRows] = React.useState<Row[]>([]);
  const [result, setResult] = React.useState<any>(null);

  const load = async () => {
    setLoading(true);
    setResult(null);
    try {
      const qs = wallet.trim() ? `?wallet=${encodeURIComponent(wallet.trim())}` : '';
      const data = await apiGet(`/api/referral/ledger${qs}`, token);
      setRows(flattenLedger(data));
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const payout = async (dryRun: boolean) => {
    setLoading(true);
    try {
      const body: any = { dryRun };
      if (wallet.trim()) body.wallet = wallet.trim().toLowerCase();
      if (tok.trim()) body.token = tok.trim().toLowerCase();
      const data = await apiPost('/api/referral/payout', body, token);
      setResult(data);
      message.success(dryRun ? 'Dry-run completed' : 'Payout executed');
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { if (token) load(); }, [token]);

  const columns = [
    { title: 'Wallet', dataIndex: 'wallet', key: 'wallet', render: (v: string) => <code>{v}</code> },
    { title: 'Chain', dataIndex: 'chainId', key: 'chainId', width: 100 },
    { title: 'Token', dataIndex: 'token', key: 'token', render: (v: string) => <code>{v}</code> },
    { title: 'Amount (wei)', dataIndex: 'amount', key: 'amount', render: (v: string) => <Tag>{v}</Tag> },
  ];

  return (
    <Shell>
      <Card title="Referral Ledger & Payout" extra={(
        <Space>
          <Input placeholder="Filter wallet (0x...)" value={wallet} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWallet(e.target.value)} style={{ width: 320 }} />
          <Input placeholder="Filter token (0x...)" value={tok} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTok(e.target.value)} style={{ width: 320 }} />
          <Button onClick={load} loading={loading}>Reload</Button>
          <Button onClick={() => payout(true)} loading={loading}>Dry-run payout</Button>
          <Button danger type="primary" onClick={() => payout(false)} loading={loading}>Execute payout</Button>
        </Space>
      )} loading={loading}>
        <Table
          rowKey={(r: Row) => `${r.wallet}-${r.chainId}-${r.token}`}
          dataSource={rows}
          columns={columns}
          size="small"
          pagination={{ pageSize: 20 }}
        />
        {result && (
          <Card size="small" title="Result" style={{ marginTop: 16 }}>
            <pre style={{ maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          </Card>
        )}
      </Card>
    </Shell>
  );
}
