import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  Database, 
  TrendingUp, 
  Clock, 
  Shield, 
  Zap,
  CheckCircle,
  Info,
  ArrowRight,
  Server,
  HardDrive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SalesImportGuide() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1>Sales Import Guide</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Pilih metode import yang sesuai dengan kebutuhan Anda. Setiap metode memiliki keunggulan dan penggunaan yang berbeda.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Context */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-blue-900">Import Context</h3>
                <p className="text-sm text-blue-700 font-normal">Temporary dashboard analytics</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Quick analytics & visualization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Instant dashboard update</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Multiple file format support</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">🏪</span>
                <span className="text-sm">Basic marketplace analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Data stored in browser memory</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Data cleared on page refresh</span>
              </div>
            </div>

            {/* Best For */}
            <div className="p-3 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">✨ Best For:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Quick data exploration</li>
                <li>• Temporary analysis</li>
                <li>• Testing different datasets</li>
                <li>• Demo & presentation</li>
              </ul>
            </div>

            {/* Action Button */}
            <Button 
              onClick={() => navigate('/import')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Go to Import Context
            </Button>
          </CardContent>
        </Card>

        {/* Import Database */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-green-900">Import Database</h3>
                <p className="text-sm text-green-700 font-normal">Permanent PostgreSQL storage</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Permanent data storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Advanced analytics capabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-bold">🏪</span>
                <span className="text-sm">Full marketplace analytics & insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Historical data tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-600" />
                <span className="text-sm">PostgreSQL backend integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm">Data persistence & backup</span>
              </div>
            </div>

            {/* Best For */}
            <div className="p-3 bg-green-100 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">🚀 Best For:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Production data management</li>
                <li>• Long-term analytics</li>
                <li>• Business intelligence</li>
                <li>• Multi-user environments</li>
              </ul>
            </div>

            {/* Action Button */}
            <Button 
              onClick={() => navigate('/import-sales')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Go to Import Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Feature</th>
                  <th className="text-center p-3 font-medium text-blue-700">Import Context</th>
                  <th className="text-center p-3 font-medium text-green-700">Import Database</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">Data Persistence</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                      Temporary
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Permanent
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Setup Complexity</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Simple
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Moderate
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Performance</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Fast
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Scalable
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Multi-user Support</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      Limited
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Full Support
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Data Backup</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      None
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Automatic
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Advanced Analytics</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                      Basic
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      Advanced
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Marketplace Analytics</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Limited
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                      Full Support
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recommended Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">1</span>
              </div>
              <h4 className="font-medium">Start with Context</h4>
              <p className="text-sm text-gray-600">
                Use Import Context for quick data exploration and validation
              </p>
              <Button 
                onClick={() => navigate('/import')} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Try Context Import
              </Button>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-medium">2</span>
              </div>
              <h4 className="font-medium">Move to Database</h4>
              <p className="text-sm text-gray-600">
                Once validated, import to database for permanent storage
              </p>
              <Button 
                onClick={() => navigate('/import-sales')} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Import to Database
              </Button>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium">3</span>
              </div>
              <h4 className="font-medium">Analyze & Report</h4>
              <p className="text-sm text-gray-600">
                Use advanced analytics and generate comprehensive reports
              </p>
              <Button 
                onClick={() => navigate('/analytics')} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketplace Analytics Feature */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏪</span>
            </div>
            <div>
              <h3 className="text-purple-900">New Feature: Marketplace Analytics</h3>
              <p className="text-sm text-purple-700 font-normal">Multi-platform sales tracking</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Track sales from TikTok Shop, Shopee, Tokopedia, Lazada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Compare performance across marketplaces</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Identify best performing channels</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Dashboard breakdown by marketplace</span>
            </div>
          </div>

          <div className="p-3 bg-purple-100 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">✨ Benefits:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Optimize marketing spend per platform</li>
              <li>• Track marketplace-specific trends</li>
              <li>• Make data-driven channel decisions</li>
              <li>• Monitor profit margins by platform</li>
            </ul>
          </div>

          <Alert className="border-purple-200 bg-purple-50">
            <AlertCircle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-700">
              <strong>Template Update:</strong> Download template terbaru yang sudah include field "Marketplace" 
              untuk mendapatkan analytics multi-platform yang comprehensive.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro Tip:</strong> Untuk production environment, gunakan Import Database untuk memastikan data tersimpan permanen. 
          Import Context ideal untuk testing dan quick analysis.
        </AlertDescription>
      </Alert>
    </div>
  );
}