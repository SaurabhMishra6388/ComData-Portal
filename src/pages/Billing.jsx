import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, CreditCard } from "lucide-react";

const invoiceData = {
  "INV-2024-001": {
    invoiceNumber: "INV-2024-001",
    issueDate: "Nov 25, 2024",
    dueDate: "Dec 5, 2024",
    project: "E-commerce Website",
    status: "Paid",
    items: [
      { description: "Frontend Development", quantity: 80, rate: 750, amount: 60000 },
      { description: "Backend Integration", quantity: 20, rate: 750, amount: 15000 },
    ],
    subtotal: 75000,
    tax: 0,
    total: 75000,
    paidAmount: 75000,
    paymentMethod: "Razorpay",
    transactionId: "pay_ABC123XYZ456",
  },
};

export default function Billing() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const invoice = invoiceData[invoiceId] || invoiceData["INV-2024-001"];

  const handlePayNow = () => {
    // Razorpay integration placeholder
    alert("Razorpay payment gateway integration will be implemented here");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/payments")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-card to-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Invoice {invoice.invoiceNumber}</CardTitle>
              <CardDescription>Issued on {invoice.issueDate}</CardDescription>
            </div>
            <Badge
              className={
                invoice.status === "Paid"
                  ? "bg-gradient-to-r from-success to-emerald-400"
                  : "bg-gradient-to-r from-warning to-orange-400"
              }
            >
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Company Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">From</h3>
              <p className="text-sm text-muted-foreground">
                ComData Solutions Pvt. Ltd.<br />
                123 Business Park<br />
                Mumbai, Maharashtra 400001<br />
                GSTIN: 27XXXXX1234X1Z5
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Bill To</h3>
              <p className="text-sm text-muted-foreground">
                Acme Corporation<br />
                456 Corporate Avenue<br />
                Mumbai, Maharashtra 400002<br />
                contact@acmecorp.com
              </p>
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Date</p>
              <p className="font-medium">{invoice.issueDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{invoice.dueDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <p className="font-medium">{invoice.project}</p>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold mb-4">Invoice Items</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 text-sm">
                  <div className="col-span-6">{item.description}</div>
                  <div className="col-span-2 text-right">{item.quantity} hrs</div>
                  <div className="col-span-2 text-right">₹{item.rate}</div>
                  <div className="col-span-2 text-right font-medium">
                    ₹{item.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (GST)</span>
              <span className="font-medium">₹{invoice.tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{invoice.total.toLocaleString()}</span>
            </div>
            {invoice.status === "Paid" && (
              <div className="flex justify-between text-sm">
                <span className="text-success">Amount Paid</span>
                <span className="font-medium text-success">₹{invoice.paidAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Payment Info */}
          {invoice.status === "Paid" && (
            <>
              <Separator />
              <div className="bg-success/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-success">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{invoice.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-medium">{invoice.transactionId}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            {invoice.status === "Pending" ? (
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={handlePayNow}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now via Razorpay
              </Button>
            ) : null}
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
