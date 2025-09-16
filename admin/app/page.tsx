"use client";
import React from 'react';
import Shell from '../src/components/Shell';
import { Card, Statistic, Row, Col } from 'antd';

export default function DashboardPage() {
  return (
    <Shell>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card title="Users">
            <Statistic title="Total" value={undefined} suffix="(fetch later)" />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title="Tokens">
            <Statistic title="Catalog" value={undefined} suffix="(fetch later)" />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card title="System">
            <Statistic title="Health" value={"OK"} />
          </Card>
        </Col>
      </Row>
    </Shell>
  );
}
