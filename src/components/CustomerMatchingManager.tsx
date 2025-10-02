import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Info,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { 
  findSimilarCustomers, 
  getBestCustomerMatch, 
  processCustomerListForImport,
  CustomerMatch,
  CustomerMatchResult
} from '../utils/customerSimilarityMatcher';
import { useApi } from '../hooks/useApi';

interface CustomerMatchingManagerProps {
  onCustomerProcessed?: (processedData: any) => void;
  showInDialog?: boolean;
}

interface CustomerProcessingStats {
  total: number;
  matched: number;
  newCustomers: number;
  autoMerged: number;
  processing: boolean;
}

export function CustomerMatchingManager({ 
  onCustomerProcessed, 
  showInDialog = false 
}: CustomerMatchingManagerProps) {
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);
  const [newCustomers, setNewCustomers] = useState<string[]>([]);
  const [testCensoredName, setTestCensoredName] = useState('');
  const [matchingResults, setMatchingResults] = useState<CustomerMatchResult | null>(null);
  const [processingStats, setProcessingStats] = useState<CustomerProcessingStats>({
    total: 0,
    matched: 0,
    newCustomers: 0,
    autoMerged: 0,
    processing: false
  });
  const [autoMergeEnabled, setAutoMergeEnabled] = useState(true);
  const [minConfidence, setMinConfidence] = useState(75);

  const { data: customerData, loading } = useApi('/api/customers-simple');

  useEffect(() => {
    if (customerData && customerData.customers) {
      const customers = customerData.customers
        .map((c: any) => c.customer)
        .filter((name: string) => name && name.trim() !== '');
      setExistingCustomers(customers);
    }
  }, [customerData]);

  const handleTestMatching = () => {
    if (!testCensoredName.trim()) return;
    
    const results = findSimilarCustomers(testCensoredName, existingCustomers, {
      minSimilarity: minConfidence,
      maxResults: 10
    });
    
    setMatchingResults(results);
  };

  const handleProcessCustomers = () => {
    if (newCustomers.length === 0) return;
    
    setProcessingStats(prev => ({ ...prev, processing: true }));
    
    setTimeout(() => {
      const result = processCustomerListForImport(newCustomers, existingCustomers, {
        minConfidence,
        autoMerge: autoMergeEnabled,
        logMatches: true
      });
      
      setProcessingStats({
        ...result.stats,
        processing: false
      });
      
      if (onCustomerProcessed) {
        onCustomerProcessed(result);
      }
    }, 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const customers = text.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      setNewCustomers(customers);
    };
    reader.readAsText(file);
  };

  const renderMatchingTable = () => {
    if (!matchingResults) return null;
    
    const allResults = [...matchingResults.matches, ...matchingResults.suggestions];
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">High Confidence Matches</p>
                  <p className="text-2xl font-semibold">{matchingResults.matches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Possible Matches</p>
                  <p className="text-2xl font-semibold">{matchingResults.suggestions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">New Customers</p>
                  <p className="text-2xl font-semibold">{matchingResults.noMatches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {allResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Matching Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Original Customer</TableHead>
                    <TableHead>Censored Name</TableHead>
                    <TableHead>Similarity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allResults.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{match.originalName}</TableCell>
                      <TableCell>{match.censoredName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={match.similarity} className="w-16" />
                          <span className="text-sm">{match.similarity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={match.isMatch ? "default" : "secondary"}>
                          {match.isMatch ? "Match" : "Suggestion"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {match.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderProcessingStats = () => {
    if (processingStats.total === 0 && !processingStats.processing) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Processing Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processingStats.processing ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing customer matching...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">{processingStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">{processingStats.matched}</p>
                <p className="text-sm text-muted-foreground">Matched</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-orange-600">{processingStats.autoMerged}</p>
                <p className="text-sm text-muted-foreground">Auto Merged</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-purple-600">{processingStats.newCustomers}</p>
                <p className="text-sm text-muted-foreground">New Customers</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const content = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Customer Name Matching</h2>
        <p className="text-muted-foreground">
          Menangani penggabungan customer dengan nama yang disensor dari TikTok Shop
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Sistem ini akan mencocokkan nama customer yang disensor (contoh: f***iaawindy) dengan data customer yang sudah ada sebelumnya (friliawindy). 
          Jika ditemukan kesamaan, data akan digabung menjadi satu customer.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">Test Matching</TabsTrigger>
          <TabsTrigger value="process">Process Import</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Customer Matching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="test-name">Nama Customer Tersensor</Label>
                  <Input
                    id="test-name"
                    placeholder="Contoh: f***iaawindy"
                    value={testCensoredName}
                    onChange={(e) => setTestCensoredName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleTestMatching} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Test Match
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div>
                  <Label htmlFor="confidence">Min Confidence (%)</Label>
                  <Input
                    id="confidence"
                    type="number"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {renderMatchingTable()}
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Customer Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload Customer List (.txt)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload file .txt dengan satu nama customer per baris
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Manual Input</Label>
                <textarea
                  placeholder="Masukkan nama customer, satu per baris..."
                  className="w-full h-32 p-3 border rounded-md"
                  value={newCustomers.join('\n')}
                  onChange={(e) => setNewCustomers(e.target.value.split('\n').filter(line => line.trim()))}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoMergeEnabled}
                    onChange={(e) => setAutoMergeEnabled(e.target.checked)}
                  />
                  <span>Auto-merge matching customers</span>
                </label>
                
                <div className="flex items-center gap-2">
                  <Label>Min Confidence:</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              </div>

              <Button 
                onClick={handleProcessCustomers}
                disabled={newCustomers.length === 0 || processingStats.processing}
                className="w-full"
              >
                {processingStats.processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Process {newCustomers.length} Customers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {renderProcessingStats()}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-semibold">{existingCustomers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ready for Matching</p>
                    <p className="text-2xl font-semibold">{newCustomers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Processing Rate</p>
                    <p className="text-2xl font-semibold">
                      {processingStats.total > 0 ? 
                        Math.round((processingStats.matched / processingStats.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips untuk matching yang optimal:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Gunakan confidence level 75-85% untuk hasil terbaik</li>
                <li>Auto-merge direkomendasikan untuk proses import otomatis</li>
                <li>Review manual matching untuk nama customer yang unik</li>
                <li>Backup data sebelum melakukan import besar-besaran</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (showInDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserCheck className="h-4 w-4 mr-2" />
            Customer Matching
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Name Matching Manager</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}

export default CustomerMatchingManager;