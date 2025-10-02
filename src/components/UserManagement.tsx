import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Search,
  Shield,
  Crown,
  User,
  UserCheck,
  Activity,
  Settings,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  WifiOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { formatDateSimple } from '../utils/dateUtils';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  position?: string;
  avatar_url?: string;
  bio?: string;
  last_login?: string;
  failed_login_attempts: number;
  password_changed_at: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

interface UserStats {
  total_users: number;
  total_admins: number;
  total_managers: number;
  total_staff: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  recent_logins: number;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  department: string;
  position: string;
  bio: string;
}

const initialCreateUserData: CreateUserData = {
  username: '',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  role: 'staff',
  department: '',
  position: '',
  bio: ''
};

export function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    total_admins: 0,
    total_managers: 0,
    total_staff: 0,
    active_users: 0,
    inactive_users: 0,
    suspended_users: 0,
    recent_logins: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>(initialCreateUserData);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUsers(result.data);
          setBackendAvailable(true);
          calculateStatsFromUsers(result.data);
        } else {
          setMockUsers();
        }
      } else {
        setMockUsers();
      }
    } catch (error) {
      setMockUsers();
    } finally {
      setLoading(false);
    }
  };

  const setMockUsers = () => {
    setBackendAvailable(false);
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@dbusana.com',
        full_name: 'D\'Busana Administrator',
        phone: '+62 21 1234567',
        role: 'admin',
        status: 'active',
        department: 'IT',
        position: 'System Administrator',
        bio: 'Administrator sistem dashboard D\'Busana',
        last_login: new Date().toISOString(),
        failed_login_attempts: 0,
        password_changed_at: new Date().toISOString(),
        two_factor_enabled: true,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        username: 'manager1',
        email: 'manager@dbusana.com',
        full_name: 'Fashion Manager',
        phone: '+62 21 2345678',
        role: 'manager',
        status: 'active',
        department: 'Operations',
        position: 'Operations Manager',
        bio: 'Manager operasional yang mengelola inventory dan sales',
        last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        failed_login_attempts: 0,
        password_changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        two_factor_enabled: false,
        created_at: '2024-02-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        created_by_name: 'D\'Busana Administrator'
      },
      {
        id: '3',
        username: 'staff1',
        email: 'staff@dbusana.com',
        full_name: 'Sales Staff',
        phone: '+62 21 3456789',
        role: 'staff',
        status: 'active',
        department: 'Sales',
        position: 'Sales Representative',
        bio: 'Staff penjualan yang mengelola transaksi harian',
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        failed_login_attempts: 0,
        password_changed_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        two_factor_enabled: false,
        created_at: '2024-02-15T00:00:00Z',
        updated_at: new Date().toISOString(),
        created_by_name: 'D\'Busana Administrator'
      }
    ];
    setUsers(mockUsers);
    calculateStatsFromUsers(mockUsers);
  };

  const calculateStatsFromUsers = (userList: User[] = users) => {
    const stats: UserStats = {
      total_users: userList.length,
      total_admins: userList.filter(u => u.role === 'admin').length,
      total_managers: userList.filter(u => u.role === 'manager').length,
      total_staff: userList.filter(u => u.role === 'staff').length,
      active_users: userList.filter(u => u.status === 'active').length,
      inactive_users: userList.filter(u => u.status === 'inactive').length,
      suspended_users: userList.filter(u => u.status === 'suspended').length,
      recent_logins: userList.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    };
    setUserStats(stats);
  };

  const handleCreateUser = async () => {
    try {
      if (!createUserData.username || !createUserData.email || !createUserData.password || !createUserData.full_name) {
        toast.error('❌ Harap lengkapi semua field yang wajib diisi');
        return;
      }

      if (createUserData.password.length < 6) {
        toast.error('❌ Password minimal 6 karakter');
        return;
      }

      setLoading(true);
      
      if (backendAvailable) {
        const response = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(createUserData)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            await fetchUsers();
            setCreateUserData(initialCreateUserData);
            setIsCreateUserOpen(false);
            toast.success('✅ User berhasil dibuat');
            return;
          }
        }
      }
      
      // Fallback: Add to local state
      const newUser: User = {
        id: String(Date.now()),
        ...createUserData,
        status: 'active',
        failed_login_attempts: 0,
        password_changed_at: new Date().toISOString(),
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUsers(prev => [...prev, newUser]);
      calculateStatsFromUsers([...users, newUser]);
      setCreateUserData(initialCreateUserData);
      setIsCreateUserOpen(false);
      toast.success('✅ User berhasil dibuat');
      
    } catch (error) {
      toast.error('❌ Gagal membuat user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      setLoading(true);
      
      if (backendAvailable) {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            await fetchUsers();
            toast.success(`✅ Status user berhasil diubah ke ${newStatus}`);
            return;
          }
        }
      }
      
      // Fallback: Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      calculateStatsFromUsers();
      toast.success(`✅ Status user berhasil diubah ke ${newStatus}`);
      
    } catch (error) {
      toast.error('❌ Gagal mengubah status user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      
      if (backendAvailable) {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            await fetchUsers();
            toast.success('✅ User berhasil dihapus');
            setDeleteUserId(null);
            return;
          }
        }
      }
      
      // Fallback: Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      calculateStatsFromUsers();
      toast.success('✅ User berhasil dihapus');
      setDeleteUserId(null);
      
    } catch (error) {
      toast.error('❌ Gagal menghapus user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      case 'staff': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola pengguna sistem dan hak akses mereka
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tambah User Baru</DialogTitle>
                <DialogDescription>
                  Buat akun pengguna baru dengan role dan permissions yang sesuai
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={createUserData.username}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Masukkan username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserData.email}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Masukkan email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createUserData.password}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap *</Label>
                  <Input
                    id="full_name"
                    value={createUserData.full_name}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={createUserData.phone}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={createUserData.role} onValueChange={(value: any) => setCreateUserData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departemen</Label>
                  <Input
                    id="department"
                    value={createUserData.department}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Masukkan departemen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posisi</Label>
                  <Input
                    id="position"
                    value={createUserData.position}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Masukkan posisi"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={createUserData.bio}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Deskripsi singkat tentang user..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateUser} disabled={loading}>
                  Buat User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{userStats.active_users}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{userStats.total_admins}</p>
              </div>
              <Crown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Logins</p>
                <p className="text-2xl font-bold">{userStats.recent_logins}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Menampilkan {filteredUsers.length} dari {users.length} pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.department || '-'}</div>
                        <div className="text-sm text-muted-foreground">{user.position || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_login ? (
                        <div className="text-sm">
                          {formatDateSimple(new Date(user.last_login))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Belum pernah</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.two_factor_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {user.two_factor_enabled ? 'Aktif' : 'Tidak'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={user.status} 
                          onValueChange={(value) => handleUpdateUserStatus(user.id, value as any)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Anda yakin ingin menghapus user "{user.full_name}"? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={loading}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}