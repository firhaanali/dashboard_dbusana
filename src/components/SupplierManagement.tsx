import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Package, Scissors, Truck, AlertTriangle, CheckCircle, DollarSign, Ruler, ShirtIcon, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner@2.0.3';

// Interface untuk Supplier Kain
interface FabricSupplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive' | 'pending';
  total_deliveries: number;
  total_meters: number;
  last_delivery_date?: string;
  created_at: string;
}

// Interface untuk Record Pengiriman Kain
interface FabricDelivery {
  id: string;
  supplier_id: string;
  supplier_name: string;
  fabric_type: string;
  color: string;
  meters_delivered: number;
  price_per_meter: number;
  total_cost: number;
  delivery_date: string;
  notes?: string;
  status: 'received' | 'pending' | 'partial';
  created_at: string;
}

// Interface untuk Penjahit
interface Tailor {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  specialization: string;
  status: 'active' | 'inactive' | 'pending';
  total_orders: number;
  total_pieces_produced: number;
  average_cost_per_piece: number;
  quality_rating: number;
  last_order_date?: string;
  created_at: string;
}

// Interface untuk Record Produksi Penjahit
interface TailorProduction {
  id: string;
  tailor_id: string;
  tailor_name: string;
  product_name: string;
  color: string;
  size: string;
  finished_stock: number;
  meters_needed: number;
  cost_per_piece: number;
  defective_stock?: number;
  additional_costs?: number;
  additional_cost_description?: string;
  delivery_date?: string;
  notes?: string;
  status: 'completed' | 'in_progress' | 'pending';
  created_at: string;
}

const COLORS = ['var(--accent-primary)', 'var(--accent-secondary)', '#FFBB28', '#FF8042', '#8884D8'];

export function SupplierManagement() {
  // States for Fabric Suppliers
  const [fabricSuppliers, setFabricSuppliers] = useState<FabricSupplier[]>([]);
  const [fabricDeliveries, setFabricDeliveries] = useState<FabricDelivery[]>([]);
  
  // States for Tailors
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [tailorProductions, setTailorProductions] = useState<TailorProduction[]>([]);
  
  // Common states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fabric-suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [isAddDeliveryDialogOpen, setIsAddDeliveryDialogOpen] = useState(false);
  const [isAddTailorDialogOpen, setIsAddTailorDialogOpen] = useState(false);
  const [isAddProductionDialogOpen, setIsAddProductionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form states for Fabric Supplier
  const [fabricSupplierForm, setFabricSupplierForm] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'COD',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

  // Form states for Fabric Delivery
  const [fabricDeliveryForm, setFabricDeliveryForm] = useState({
    supplier_id: '',
    fabric_type: '',
    color: '',
    meters_delivered: '',
    price_per_meter: '',
    delivery_date: '',
    notes: '',
    status: 'received' as 'received' | 'pending' | 'partial'
  });

  // Form states for Tailor
  const [tailorForm, setTailorForm] = useState({
    code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    specialization: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

  // Form states for Tailor Production
  const [tailorProductionForm, setTailorProductionForm] = useState({
    tailor_id: '',
    product_name: '',
    color: '',
    size: '',
    finished_stock: '',
    meters_needed: '',
    cost_per_piece: '',
    defective_stock: '',
    additional_costs: '',
    additional_cost_description: '',
    delivery_date: '',
    notes: '',
    status: 'completed' as 'completed' | 'in_progress' | 'pending'
  });

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalFabricSuppliers: 0,
    totalTailors: 0,
    totalFabricDelivered: 0,
    totalPiecesProduced: 0,
    totalDefectiveStock: 0,
    averageQualityRating: 0,
    totalProductionCost: 0,
    recentActivities: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch suppliers from database
      const response = await fetch('http://localhost:3001/api/suppliers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Map backend suppliers to fabric suppliers format
          const mappedSuppliers = data.data.map((supplier: any) => ({
            id: supplier.id,
            code: supplier.code,
            name: supplier.name,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            status: supplier.status,
            total_deliveries: 0, // Will be calculated from delivery records
            total_meters: 0, // Will be calculated from delivery records
            last_delivery_date: null,
            created_at: supplier.created_at
          }));
          setFabricSuppliers(mappedSuppliers);
          console.log('✅ Suppliers loaded from database:', mappedSuppliers.length);
        } else {
          console.log('❌ No supplier data from backend - using empty array');
          setFabricSuppliers([]);
        }
      } else {
        console.log('❌ Backend not available for suppliers - using empty array');
        setFabricSuppliers([]);
      }

      // Initialize empty arrays for other data (will be implemented later)
      setFabricDeliveries([]);
      
      // Fetch tailors from database
      const tailorResponse = await fetch('http://localhost:3001/api/tailors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (tailorResponse.ok) {
        const tailorData = await tailorResponse.json();
        if (tailorData.success && Array.isArray(tailorData.data)) {
          setTailors(tailorData.data);
          console.log('✅ Tailors loaded from database:', tailorData.data.length);
        } else {
          console.log('❌ No tailor data from backend - using empty array');
          setTailors([]);
        }
      } else {
        console.log('❌ Backend not available for tailors - using empty array');
        setTailors([]);
      }
      
      // Fetch tailor productions from database
      const productionResponse = await fetch('http://localhost:3001/api/tailors/productions/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (productionResponse.ok) {
        const productionData = await productionResponse.json();
        if (productionData.success && Array.isArray(productionData.data)) {
          setTailorProductions(productionData.data);
          console.log('✅ Tailor productions loaded from database:', productionData.data.length);
        } else {
          console.log('❌ No production data from backend - using empty array');
          setTailorProductions([]);
        }
      } else {
        console.log('❌ Backend not available for productions - using empty array');
        setTailorProductions([]);
      }

      // Initialize empty analytics
      setAnalytics({
        totalFabricSuppliers: 0,
        totalTailors: 0,
        totalFabricDelivered: 0,
        totalPiecesProduced: 0,
        totalDefectiveStock: 0,
        averageQualityRating: 0,
        totalProductionCost: 0,
        recentActivities: []
      });

    } catch (error) {
      console.error('❌ Error fetching supplier data:', error);
      // Set empty arrays on error
      setFabricSuppliers([]);
      setFabricDeliveries([]);
      setTailors([]);
      setTailorProductions([]);
      setAnalytics({
        totalFabricSuppliers: 0,
        totalTailors: 0,
        totalFabricDelivered: 0,
        totalPiecesProduced: 0,
        totalDefectiveStock: 0,
        averageQualityRating: 0,
        totalProductionCost: 0,
        recentActivities: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
      case 'received':
      case 'completed':
        return <Badge className="bg-accent-secondary text-accent-secondary-foreground">{status === 'active' ? 'Aktif' : status === 'received' ? 'Diterima' : 'Selesai'}</Badge>;
      case 'inactive': 
        return <Badge className="bg-destructive/10 text-destructive">Tidak Aktif</Badge>;
      case 'pending':
      case 'in_progress':
        return <Badge className="bg-accent-muted text-accent-primary">{status === 'pending' ? 'Menunggu' : 'Sedang Proses'}</Badge>;
      case 'partial':
        return <Badge className="bg-accent-secondary text-accent-secondary-foreground">Sebagian</Badge>;
      default: 
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredFabricSuppliers = fabricSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTailors = tailors.filter(tailor => {
    const matchesSearch = tailor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tailor.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tailor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Suppliers</h1>
          <p className="text-muted-foreground">
            Sistem manajemen bisnis fashion terintegrasi
          </p>
        </div>
      </div>

      {/* KPI Cards - Dynamic based on active tab */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {activeTab === 'fabric-suppliers' && (
          <>
            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Supplier</p>
                    <p className="text-lg font-bold text-foreground">{filteredFabricSuppliers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Supplier Aktif</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredFabricSuppliers.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Pengiriman</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredFabricSuppliers.reduce((sum, s) => sum + s.total_deliveries, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Meter Kain</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredFabricSuppliers.reduce((sum, s) => sum + s.total_meters, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'fabric-deliveries' && (
          <>
            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Pengiriman</p>
                    <p className="text-lg font-bold text-foreground">{fabricDeliveries.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Meter</p>
                    <p className="text-lg font-bold text-foreground">
                      {fabricDeliveries.reduce((sum, d) => sum + d.meters_delivered, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Biaya</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(fabricDeliveries.reduce((sum, d) => sum + d.total_cost, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Selesai Dikirim</p>
                    <p className="text-lg font-bold text-foreground">
                      {fabricDeliveries.filter(d => d.status === 'received').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'tailors' && (
          <>
            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Penjahit</p>
                    <p className="text-lg font-bold text-foreground">{filteredTailors.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Penjahit Aktif</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredTailors.filter(t => t.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <ShirtIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Produksi</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredTailors.reduce((sum, t) => sum + t.total_pieces_produced, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Rating Rata-rata</p>
                    <p className="text-lg font-bold text-foreground">
                      {filteredTailors.length > 0 
                        ? (filteredTailors.reduce((sum, t) => sum + t.quality_rating, 0) / filteredTailors.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'tailor-productions' && (
          <>
            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <ShirtIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Produksi</p>
                    <p className="text-lg font-bold text-foreground">{tailorProductions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Barang Jadi</p>
                    <p className="text-lg font-bold text-foreground">
                      {tailorProductions.reduce((sum, p) => sum + p.finished_stock, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Barang Rusak</p>
                    <p className="text-lg font-bold text-foreground">
                      {tailorProductions.reduce((sum, p) => sum + (p.defective_stock || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent-border bg-gradient-to-r from-accent-muted to-accent-secondary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary text-accent-primary-foreground rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-accent-secondary-foreground">Total Biaya Produksi</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(tailorProductions.reduce((sum, p) => sum + (p.cost_per_piece * p.finished_stock), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fabric-suppliers" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Supplier Kain
          </TabsTrigger>
          <TabsTrigger value="fabric-deliveries" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Pengiriman Kain
          </TabsTrigger>
          <TabsTrigger value="tailors" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Penjahit
          </TabsTrigger>
          <TabsTrigger value="tailor-productions" className="flex items-center gap-2">
            <ShirtIcon className="w-4 h-4" />
            Produksi Penjahit
          </TabsTrigger>
        </TabsList>

        {/* Fabric Suppliers Tab */}
        <TabsContent value="fabric-suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Supplier Kain</CardTitle>
              <CardDescription>
                Kelola data supplier kain dan vendor bahan baku
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Cari supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchData}>
                  Refresh Data
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Supplier</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Pengiriman</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFabricSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              <span className="ml-2">Memuat data...</span>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>Belum ada data supplier kain</p>
                              <p className="text-sm">Data akan ditampilkan setelah backend tersedia</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFabricSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>{supplier.code}</TableCell>
                          <TableCell>{supplier.name}</TableCell>
                          <TableCell>{supplier.contact_person}<br />
                            <span className="text-sm text-muted-foreground">{supplier.phone}</span>
                          </TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                          <TableCell>{supplier.total_deliveries}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fabric Deliveries Tab */}
        <TabsContent value="fabric-deliveries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Pengiriman Kain</CardTitle>
              <CardDescription>
                Catat dan pantau pengiriman kain dari supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Fitur pengiriman kain akan tersedia setelah backend terintegrasi</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tailors Tab */}
        <TabsContent value="tailors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Penjahit</CardTitle>
              <CardDescription>
                Kelola data penjahit dan vendor produksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Cari penjahit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchData}>
                  Refresh Data
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Penjahit</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Spesialisasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTailors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-center text-muted-foreground">
                            <Scissors className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada data penjahit</p>
                            <p className="text-sm">Data akan ditampilkan setelah backend tersedia</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTailors.map((tailor) => (
                        <TableRow key={tailor.id}>
                          <TableCell>{tailor.code}</TableCell>
                          <TableCell>{tailor.name}</TableCell>
                          <TableCell>{tailor.contact_person}<br />
                            <span className="text-sm text-muted-foreground">{tailor.phone}</span>
                          </TableCell>
                          <TableCell>{tailor.specialization}</TableCell>
                          <TableCell>{getStatusBadge(tailor.status)}</TableCell>
                          <TableCell>{tailor.quality_rating}/5</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tailor Productions Tab */}
        <TabsContent value="tailor-productions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Produksi Penjahit</CardTitle>
              <CardDescription>
                Catat dan pantau hasil produksi dari penjahit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Penjahit</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Warna/Ukuran</TableHead>
                      <TableHead>Barang Jadi</TableHead>
                      <TableHead>Barang Rusak</TableHead>
                      <TableHead>Biaya</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tailorProductions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-center text-muted-foreground">
                            <ShirtIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada data produksi</p>
                            <p className="text-sm">Data akan ditampilkan setelah backend tersedia</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tailorProductions.map((production) => (
                        <TableRow key={production.id}>
                          <TableCell>{production.tailor_name}</TableCell>
                          <TableCell>{production.product_name}</TableCell>
                          <TableCell>{production.color} / {production.size}</TableCell>
                          <TableCell>{production.finished_stock} pcs</TableCell>
                          <TableCell>{production.defective_stock || 0} pcs</TableCell>
                          <TableCell>{formatCurrency(production.cost_per_piece)}</TableCell>
                          <TableCell>{getStatusBadge(production.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}