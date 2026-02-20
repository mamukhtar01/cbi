'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/plots';

const { Title } = Typography;

interface DashboardData {
  totalBeneficiaries: number;
  totalPayments: number;
  successPayments: number;
  failedPayments: number;
  delayedPayments: number;
  pendingPayments: number;
  totalDisbursed: number;
  paymentsByStatus: { status: string; _count: { id: number } }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const pieData = data.paymentsByStatus.map((item) => ({
    type: item.status,
    value: item._count.id,
  }));

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer' },
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Beneficiaries"
              value={data.totalBeneficiaries}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Payments"
              value={data.totalPayments}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Successful Payments"
              value={data.successPayments}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Failed Payments"
              value={data.failedPayments}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Disbursed"
              value={data.totalDisbursed}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>
      {pieData.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Payments by Status">
              <Pie {...pieConfig} />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
