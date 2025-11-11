import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, CreditCard, FileText, Bell, TrendingUp, Clock, Users, ShoppingCart, BarChart3, TrendingDown, Eye } from "lucide-react";

// Import Recharts components
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

// --- DATA DEFINITIONS ---

// Data for the main header cards (Daily Visits, Revenue, Orders, Users)
const headerStats = [
  { name: "DAILY VISITS", value: "8,652", icon: Eye, change: "2.87% Since last month", trend: 'down', color: 'bg-pink-600' },
  { name: "REVENUE", value: "$9,254.62", icon: BarChart3, change: "18.25% Since last month", trend: 'up', color: 'bg-purple-600' },
  { name: "ORDERS", value: "753", icon: ShoppingCart, change: "5.78% Since last month", trend: 'down', color: 'bg-sky-500' },
  { name: "USERS", value: "63,154", icon: Users, change: "8.22% Since last month", trend: 'up', color: 'bg-teal-500' },
];

// Data for the Weekly Sales Report Chart (Bar + Line)
const weeklySalesData = [
  { name: 'Sunday', Revenue: 420, Sales: 300, Profit: 350 },
  { name: 'Monday', Revenue: 500, Sales: 350, Profit: 250 },
  { name: 'Tuesday', Revenue: 400, Sales: 320, Profit: 300 },
  { name: 'Wednesday', Revenue: 520, Sales: 400, Profit: 450 },
  { name: 'Thursday', Revenue: 200, Sales: 180, Profit: 150 },
  { name: 'Friday', Revenue: 450, Sales: 400, Profit: 380 },
  { name: 'Saturday', Revenue: 200, Sales: 380, Profit: 400 },
];

// Data for the Yearly Sales Report Chart (Area Chart)
const yearlySalesData = [
    { name: '2017', trend1: 27, trend2: 20 },
    { name: '2018', trend1: 29, trend2: 24 },
    { name: '2019', trend1: 31, trend2: 28 },
    { name: '2020', trend1: 35, trend2: 32 },
    { name: '2021', trend1: 39, trend2: 36 },
    { name: '2022', trend1: 42, trend2: 39 },
    { name: '2023', trend1: 45, trend2: 42 },
];

// Data for the 'Projects' table at the bottom
const projectTableData = [
  { id: 1, name: "Velonic Admin v1", startDate: "01/01/2015", dueDate: "26/04/2015", status: "Released", assign: "Techzaa Studio" },
  { id: 2, name: "Velonic Frontend v1", startDate: "01/01/2015", dueDate: "26/04/2015", status: "Released", assign: "Techzaa Studio" },
  { id: 3, name: "ERP System", startDate: "15/02/2015", dueDate: "30/06/2015", status: "Released", assign: "Web Design Inc." },
  { id: 4, name: "Mobile Marketing", startDate: "01/03/2015", dueDate: "15/05/2015", status: "Pending", assign: "Marketing Agency" },
];


// --- CHART COMPONENTS (FIXED) ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border shadow-lg rounded-md text-sm">
        <p className="font-bold">{label}</p>
        {payload.map((p, index) => (
          <p key={index} style={{ color: p.color }}>
            {`${p.name}: $${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Fixed Weekly Sales Report Chart
const WeeklySalesChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={weeklySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} />
      <YAxis axisLine={false} tickLine={false} domain={[0, 550]} />
      <Tooltip content={<CustomTooltip />} />
      <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
      {/* Revenue bars (Blue) */}
      <Bar dataKey="Revenue" fill="#4BC0C0" name="Revenue" /> 
      {/* Sales bars (Dark Blue/Gray) */}
      <Bar dataKey="Sales" fill="#36A2EB" name="Sales" /> 
      {/* Profit line (Matching the style of the image for line/bar mix) */}
      <Line type="monotone" dataKey="Profit" stroke="#000000" dot={false} strokeWidth={2} name="Profit" /> 
    </BarChart>
  </ResponsiveContainer>
);

// Fixed Yearly Sales Report Chart
const YearlySalesChart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={yearlySalesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
      <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="name" axisLine={false} tickLine={false} />
      <YAxis axisLine={false} tickLine={false} domain={[10, 50]} />
      <Tooltip content={<CustomTooltip />} />
      {/* Top line/area (Light Blue-Green) */}
      <Area type="monotone" dataKey="trend1" stroke="#4BC0C0" fill="url(#colorTrend1)" strokeWidth={2} name="Trend 1" />
      {/* Bottom line/area (Darker Gray) */}
      <Area type="monotone" dataKey="trend2" stroke="#36A2EB" fill="url(#colorTrend2)" strokeWidth={2} name="Trend 2" />
      <defs>
        <linearGradient id="colorTrend1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#4BC0C0" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#4BC0C0" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorTrend2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#36A2EB" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#36A2EB" stopOpacity={0}/>
        </linearGradient>
      </defs>
    </AreaChart>
  </ResponsiveContainer>
);


// --- MAIN DASHBOARD COMPONENT ---

export default function Dashboard() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* 1. Header Cards (Daily Visits, Revenue, Orders, Users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {headerStats.map((stat) => (
          <Card key={stat.name} className={`text-white p-6 ${stat.color} rounded-xl shadow-lg transition-all hover:shadow-xl`}>
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold opacity-80 tracking-wider">{stat.name}</h2>
              <div className="p-2 rounded-full border border-white/30">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-4xl font-bold">{stat.value}</p>
              <div className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-green-200' : 'text-red-200'}`}>
                {stat.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      ---
      
      {/* 2. Charts Section (Weekly Sales and Yearly Sales) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Report (2/3 width on large screens) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Sales Report</CardTitle>
          </CardHeader>
          <CardContent>
            {/* The live chart component */}
            <WeeklySalesChart />
            
            {/* Summary Stats below the chart */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 text-center gap-4">
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Current Week</p>
                <p className="text-xl font-bold text-primary">$506.54</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Previous Week</p>
                <p className="text-xl font-bold text-muted-foreground">$305.25</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Conversation</p>
                <p className="text-xl font-bold text-primary">3.27%</p>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="text-xl font-bold text-primary">3k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yearly Sales Report (1/3 width on large screens) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Yearly Sales Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* The live chart component */}
            <YearlySalesChart />
            
            {/* Quarterly stats */}
            <div className="grid grid-cols-3 text-center pt-4 border-t">
              <div>
                <p className="text-sm font-semibold">Quarter 1</p>
                <p className="text-lg font-bold text-muted-foreground">$56.2k</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Quarter 2</p>
                <p className="text-lg font-bold text-muted-foreground">$42.5k</p>
              </div>
              <div>
                <p className="text-sm font-semibold">All Time</p>
                <p className="text-lg font-bold text-primary">$102.03k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      ---

      {/* 3. Bottom Section (Chat Widget and Projects Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Widget (1/3 width on large screens) */}
        <Card className="lg:col-span-1 min-h-[350px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Chat</CardTitle>
            <div className="flex space-x-2">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                &minus;
              </button>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                &times;
              </button>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] overflow-y-auto flex flex-col justify-end space-y-3">
            {/* Chat Messages Placeholder */}
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">G</div>
              <div className="bg-gray-100 p-2 rounded-lg max-w-[70%]">
                <p className="text-xs font-semibold">Genova</p>
                <p className="text-sm">Hello!</p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <div className="bg-blue-500 text-white p-2 rounded-lg max-w-[70%]">
                <p className="text-xs font-semibold text-white/80">Phuasan</p>
                <p className="text-sm">Hi! How are you? What about our next meeting?</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">P</div>
            </div>
          </CardContent>
          {/* Input Placeholder */}
          <div className="p-4 border-t">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Card>

        {/* Projects Table (2/3 width on large screens) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Projects</CardTitle>
            <div className="flex space-x-2">
              <button className="text-muted-foreground hover:text-primary transition-colors">
                &minus;
              </button>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                &times;
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectTableData.map((project) => (
                    <tr key={project.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{project.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{project.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{project.startDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{project.dueDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="default" className="bg-green-500 hover:bg-green-500/90 text-white rounded-sm text-xs">
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{project.assign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}