import React from 'react';
import Shell from '@/components/admin/Shell';
import { Card, Row, Col, Statistic, Descriptions, Table, Space, Button, message } from 'antd';
import { apiGet } from '@/lib/admin/api';

export default function AdminHealthPage() {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiGet('/api/health');
      setData(d);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const memoryRows = data ? [
    { key: 'rss', name: 'RSS', value: data.memory?.rss },
    { key: 'heapTotal', name: 'Heap Total', value: data.memory?.heapTotal },
    { key: 'heapUsed', name: 'Heap Used', value: data.memory?.heapUsed },
    { key: 'external', name: 'External', value: data.memory?.external },
  ] : [];

  return (
    <Shell>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title="Wallets" value={data?.wallets?.count ?? 0} loading={loading} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title="Tokens" value={data?.tokens?.count ?? 0} loading={loading} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title="Uptime (sec)" value={data?.uptimeSec ?? 0} loading={loading} />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={6}>
            <Card>
              <Statistic title="Chain ID" value={data?.chainId ?? '-'} loading={loading} />
            </Card>
          </Col>
        </Row>

        <Card title="Environment" extra={<Button onClick={load} loading={loading}>Reload</Button>}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Time">{data?.time}</Descriptions.Item>
            <Descriptions.Item label="Node">{data?.node}</Descriptions.Item>
            <Descriptions.Item label="Env">{data?.env}</Descriptions.Item>
            <Descriptions.Item label="Features">{data ? JSON.stringify(data.features) : '-'}</Descriptions.Item>
            <Descriptions.Item label="Tokens updatedAt">{data?.tokens?.updatedAt || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Memory Usage">
          <Table
            size="small"
            rowKey={(r) => (r as any).key}
            columns={[{ title: 'Metric', dataIndex: 'name', key: 'name' }, { title: 'Value', dataIndex: 'value', key: 'value' }]}
            dataSource={memoryRows}
            pagination={false}
          />
        </Card>
      </Space>
    </Shell>
  );
}
