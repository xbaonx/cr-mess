"use client";
import React from 'react';
import Shell from '../../src/components/Shell';
import { Card, Table, Input, Space, Button, Drawer, Form, message } from 'antd';
import { apiGet, apiPost, apiDelete } from '../../src/lib/api';
import { useAdminToken } from '../../src/lib/useAdminToken';

export default function UsersPage() {
  const { token } = useAdminToken();
  const [loading, setLoading] = React.useState(false);
  const [uids, setUids] = React.useState<string[]>([]);
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<any>(null);
  const [uid, setUid] = React.useState<string>('');
  const [meta, setMeta] = React.useState<string>('{}');

  const load = async (params?: { q?: string }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: '5000', ...(params?.q ? { q: params.q } : {}) }).toString();
      const data = await apiGet(`/api/admin/users?${query}`, token);
      setUids(data?.uids || []);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const openDetail = async (u: string) => {
    setUid(u);
    setOpen(true);
    setDetail(null);
    try {
      const data = await apiGet(`/api/admin/users/${encodeURIComponent(u)}`, token);
      setDetail(data);
      setMeta(JSON.stringify(data?.metadata || {}, null, 2));
    } catch (e: any) { message.error(e.message); }
  };

  const saveMeta = async () => {
    try {
      let parsed: any = {};
      try { parsed = JSON.parse(meta || '{}'); } catch { throw new Error('Metadata must be valid JSON'); }
      const data = await apiPost(`/api/admin/users/${encodeURIComponent(uid)}`, { metadata: parsed }, token);
      setDetail(data);
      message.success('Saved');
    } catch (e: any) { message.error(e.message); }
  };

  const deleteUser = async () => {
    try {
      await apiDelete(`/api/admin/users/${encodeURIComponent(uid)}`, token);
      setOpen(false);
      setUids((arr) => arr.filter((x) => x !== uid));
      message.success('Deleted');
    } catch (e: any) { message.error(e.message); }
  };

  React.useEffect(() => { if (token) load(); }, [token]);

  const columns = [
    { title: 'UID', dataIndex: 'uid', key: 'uid', render: (v: string) => <code>{v}</code> },
  ];

  return (
    <Shell>
      <Card title="Users" extra={(
        <Space>
          <Input.Search placeholder="Search uid" value={q} onChange={(e) => setQ(e.target.value)} onSearch={(v) => load({ q: v })} allowClear />
          <Button onClick={() => load({ q })}>Reload</Button>
        </Space>
      )}>
        <Table
          size="small"
          rowKey={(r) => r}
          loading={loading}
          dataSource={uids}
          columns={columns}
          onRow={(record) => ({ onClick: () => openDetail(record as string) })}
          pagination={{ pageSize: 20 }}
        />

        <Drawer title={uid} open={open} onClose={() => setOpen(false)} width={560}>
          {!detail ? 'Loading...' : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Card size="small" title="Details">
                <pre style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(detail, null, 2)}</pre>
              </Card>
              <Card size="small" title="Metadata (JSON)">
                <Form layout="vertical" onFinish={saveMeta}>
                  <Form.Item>
                    <Input.TextArea rows={8} value={meta} onChange={(e) => setMeta(e.target.value)} />
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">Save</Button>
                    <Button danger onClick={deleteUser}>Delete user</Button>
                  </Space>
                </Form>
              </Card>
            </Space>
          )}
        </Drawer>
      </Card>
    </Shell>
  );
}
