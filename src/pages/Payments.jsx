import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CreditCard, DollarSign, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const paymentStats = [
  { label: "Total Paid", value: "₹5,45,000", icon: DollarSign, gradient: "from-success to-emerald-400" },
  { label: "Pending", value: "₹75,000", icon: CreditCard, gradient: "from-warning to-orange-400" },
  { label: "This Month", value: "₹1,25,000", icon: TrendingUp, gradient: "from-primary to-secondary" },
];

const paymentHistory = [
  {
    id: 1,
    invoice: "INV-2024-001",
    project: "E-commerce Website",
    amount: "₹75,000",
    date: "Nov 25, 2024",
    dueDate: "Dec 5, 2024",
    status: "Paid",
    paymentMethod: "Razorpay",
  },
  {
    id: 2,
    invoice: "INV-2024-002",
    project: "Mobile App Development",
    amount: "₹50,000",
    date: "Nov 18, 2024",
    dueDate: "Nov 28, 2024",
    status: "Paid",
    paymentMethod: "Bank Transfer",
  },
  {
    id: 3,
    invoice: "INV-2024-003",
    project: "E-commerce Website",
    amount: "₹1,20,000",
    date: "Nov 10, 2024",
    dueDate: "Nov 20, 2024",
    status: "Paid",
    paymentMethod: "Razorpay",
  },
  {
    id: 4,
    invoice: "INV-2024-004",
    project: "Brand Identity Design",
    amount: "₹75,000",
    date: "Nov 5, 2024",
    dueDate: "Nov 15, 2024",
    status: "Pending",
    paymentMethod: "Razorpay",
  },
  {
    id: 5,
    invoice: "INV-2023-015",
    project: "SEO Optimization",
    amount: "₹85,000",
    date: "Oct 20, 2024",
    dueDate: "Oct 30, 2024",
    status: "Paid",
    paymentMethod: "Razorpay",
  },
];

export default function Payments() {
  const navigate = useNavigate();

  const handleInvoiceClick = (invoiceId) => {
    navigate(`/billing/${invoiceId}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Payments & Billing</h1>
        <p className="text-muted-foreground">View your payment history and manage invoices</p>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paymentStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Complete record of all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.invoice}</TableCell>
                  <TableCell>{payment.project}</TableCell>
                  <TableCell className="font-bold">{payment.amount}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge
                      variant={payment.status === "Paid" ? "default" : "secondary"}
                      className={payment.status === "Paid" ? "bg-gradient-to-r from-success to-emerald-400" : "bg-gradient-to-r from-warning to-orange-400"}
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInvoiceClick(payment.invoice)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <CreditCard className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download All Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
