'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface ReconciliationResult {
  total: number;
  reconciled: number;
  failed: number;
}

function ReconciliationContent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch('/api/payments/reconcile', { method: 'POST' });

    if (res.ok) {
      setResult(await res.json());
    } else {
      const err = await res.json();
      setError(err.error ?? 'Reconciliation failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        Wave Reconciliation
      </Title>
      <Card>
        <p style={{ marginBottom: 16 }}>
          This will push all unreconciled successful payments to Wave Mobile
          Money and mark them as reconciled.
        </p>
        <Button
          type="primary"
          icon={<SyncOutlined spin={loading} />}
          onClick={runReconciliation}
          loading={loading}
          size="large"
        >
          Run Reconciliation
        </Button>
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Spin size="large" />
          <p>Running reconciliation...</p>
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginTop: 16 }}
          showIcon
        />
      )}

      {result && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic title="Total Processed" value={result.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Reconciled"
                value={result.reconciled}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Failed"
                value={result.failed}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default function ReconciliationPage() {
  return (
    <PageWrapper>
      <ReconciliationContent />
    </PageWrapper>
  );
}
