import React from 'react';
import Shell from '@/components/admin/Shell';
import { Card, Statistic, Row, Col, message } from 'antd';
import { apiGet } from '@/lib/admin/api';

export default function AdminDashboardPage() {
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

  return (
    <Shell>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card title="Users">
            <Statistic title="Wallets" value={data?.wallets?.count ?? 0} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title="Tokens">
            <Statistic title="Catalog" value={data?.tokens?.count ?? 0} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title="System">
            <Statistic title="Uptime (sec)" value={data?.uptimeSec ?? 0} loading={loading} />
          </Card>
        </Col>
      </Row>
    </Shell>
  );
}
