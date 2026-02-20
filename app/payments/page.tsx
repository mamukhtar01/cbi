'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  message,
  Typography,
  Tag,
  Space,
  Progress,
  Alert,
} from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import PageWrapper from '@/components/PageWrapper';

const { Title } = Typography;

interface Beneficiary {
  id: string;
  name: string;
  phone: string;
}

interface BudgetLine {
  id: string;
  name: string;
  totalAmount: number;
  usedAmount: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  beneficiary: Beneficiary;
  budgetLine: BudgetLine;
}

interface BulkJobStatus {
  id: string;
  status: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
}

function PaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJob, setBulkJob] = useState<BulkJobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    const [p, b, bl] = await Promise.all([
      fetch('/api/payments').then((r) => r.json()),
      fetch('/api/beneficiaries').then((r) => r.json()),
      fetch('/api/budget-lines').then((r) => r.json()),
    ]);
    setPayments(p);
    setBeneficiaries(b);
    setBudgetLines(bl);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSinglePayment = async (values: {
    beneficiaryId: string;
    budgetLineId: string;
    amount: number;
  }) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const result = await res.json();
      message.success(`Payment ${result.status}: ${result.message}`);
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } else {
      const err = await res.json();
      message.error(err.error ?? 'Payment failed');
    }
  };

  const handleBulkPayment = async (values: {
    beneficiaryIds: string[];
    budgetLineId: string;
    amount: number;
  }) => {
    const paymentsData = values.beneficiaryIds.map((id) => ({
      beneficiaryId: id,
      budgetLineId: values.budgetLineId,
      amount: values.amount,
    }));

    const res = await fetch('/api/payments/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payments: paymentsData }),
    });

    if (!res.ok) {
      message.error('Failed to start bulk job');
      return;
    }

    const { jobId } = await res.json();
    message.info(`Bulk job started: ${jobId}`);

    pollRef.current = setInterval(async () => {
      const statusRes = await fetch(`/api/payments/bulk-status?jobId=${jobId}`);
      const status = await statusRes.json();
      setBulkJob(status);

      if (status.status === 'COMPLETED') {
        if (pollRef.current) clearInterval(pollRef.current);
        message.success(
          `Bulk job completed: ${status.succeeded} succeeded, ${status.failed} failed`
        );
        fetchAll();
      }
    }, 2000);

    setBulkModalOpen(false);
    bulkForm.resetFields();
  };

  const statusColors: Record<string, string> = {
    SUCCESS: 'green',
    FAILED: 'red',
    DELAYED: 'orange',
    PENDING: 'blue',
  };

  const columns = [
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (r: Payment) =>
        r.beneficiary ? `${r.beneficiary.name} (${r.beneficiary.phone})` : '-',
    },
    {
      title: 'Budget Line',
      key: 'budgetLine',
      render: (r: Payment) => r.budgetLine?.name ?? '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (a: number) => `$${a}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s] ?? 'default'}>{s}</Tag>
      ),
    },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Payments
        </Title>
        <Space>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setBulkModalOpen(true)}
          >
            Bulk Payment
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            New Payment
          </Button>
        </Space>
      </div>

      {bulkJob && (
        <Alert
          style={{ marginBottom: 16 }}
          type={bulkJob.status === 'COMPLETED' ? 'success' : 'info'}
          message={`Bulk Job: ${bulkJob.status}`}
          description={
            <Progress
              percent={Math.round((bulkJob.processed / bulkJob.total) * 100)}
              status={bulkJob.status === 'COMPLETED' ? 'success' : 'active'}
              format={() =>
                `${bulkJob.processed}/${bulkJob.total} (✓${bulkJob.succeeded} ✗${bulkJob.failed})`
              }
            />
          }
        />
      )}

      <Table
        columns={columns}
        dataSource={payments}
        loading={loading}
        rowKey="id"
      />

      <Modal
        title="New Payment"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSinglePayment}>
          <Form.Item
            name="beneficiaryId"
            label="Beneficiary"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={beneficiaries.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.phone})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="budgetLineId"
            label="Budget Line"
            rules={[{ required: true }]}
          >
            <Select
              options={budgetLines.map((bl) => ({
                value: bl.id,
                label: `${bl.name} (Remaining: $${bl.totalAmount - bl.usedAmount})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Process Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Bulk Payment"
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        footer={null}
      >
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkPayment}>
          <Form.Item
            name="beneficiaryIds"
            label="Beneficiaries"
            rules={[{ required: true }]}
          >
            <Select
              mode="multiple"
              showSearch
              options={beneficiaries.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.phone})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="budgetLineId"
            label="Budget Line"
            rules={[{ required: true }]}
          >
            <Select
              options={budgetLines.map((bl) => ({
                value: bl.id,
                label: `${bl.name} (Remaining: $${bl.totalAmount - bl.usedAmount})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount per Beneficiary"
            rules={[{ required: true }]}
          >
            <InputNumber min={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Start Bulk Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <PageWrapper>
      <PaymentsContent />
    </PageWrapper>
  );
}
