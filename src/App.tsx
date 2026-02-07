import { useState, useEffect } from 'react'
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Settings, TrendingUp, DollarSign, Percent, Award, RefreshCw, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Stock {
  ticker: string
  name: string
  price: number
  yield: number
  sector?: string
  category?: string
}

interface HistoryData {
  dates: string[]
  prices: number[]
}

interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

interface LastUpdate {
  lastUpdate: string
  autoUpdateEnabled?: boolean
  nextScheduledUpdate?: string
}

function App() {
  const [reits, setReits] = useState<Stock[]>([])
  const [etfs, setEtfs] = useState<Stock[]>([])
  const [reitHistories, setReitHistories] = useState<Record<string, HistoryData>>({})
  const [etfHistories, setEtfHistories] = useState<Record<string, HistoryData>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [nextUpdate, setNextUpdate] = useState<string>('')
  
  // Configuration state
  const [maxPrice, setMaxPrice] = useState<number>(20)
  const [topCount, setTopCount] = useState<number>(3)
  const [minYield, setMinYield] = useState<number>(5)
  const [showConfig, setShowConfig] = useState(false)

  // Load data from JSON files
  const loadData = async () => {
    setLoading(true)
    try {
      const [reitsRes, etfsRes, reitHistRes, etfHistRes, lastUpdateRes] = await Promise.all([
        fetch('/data/reits.json'),
        fetch('/data/etfs.json'),
        fetch('/data/reit_histories.json'),
        fetch('/data/etf_histories.json'),
        fetch('/data/last_update.json').catch(() => null)
      ])
      
      const reitsData = await reitsRes.json()
      const etfsData = await etfsRes.json()
      const reitHistData = await reitHistRes.json()
      const etfHistData = await etfHistRes.json()
      
      setReits(reitsData)
      setEtfs(etfsData)
      setReitHistories(reitHistData)
      setEtfHistories(etfHistData)
      
      // Load last update info
      if (lastUpdateRes) {
        const lastUpdateData: LastUpdate = await lastUpdateRes.json()
        setLastUpdated(new Date(lastUpdateData.lastUpdate).toLocaleString())
        if (lastUpdateData.autoUpdateEnabled !== undefined) {
          setAutoUpdateEnabled(lastUpdateData.autoUpdateEnabled)
        }
        if (lastUpdateData.nextScheduledUpdate) {
          setNextUpdate(new Date(lastUpdateData.nextScheduledUpdate).toLocaleString())
        }
      } else {
        setLastUpdated(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    }
    setLoading(false)
  }

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true)
    toast.info('Fetching latest market data...')
    
    try {
      // In a real deployment, this would call the backend API
      // For now, we just reload the data
      await loadData()
      toast.success('Data refreshed successfully!')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  // Toggle auto-update
  const toggleAutoUpdate = async () => {
    const newValue = !autoUpdateEnabled
    setAutoUpdateEnabled(newValue)
    
    // Save preference
    try {
      const response = await fetch('/data/last_update.json')
      const data = await response.json()
      data.autoUpdateEnabled = newValue
      
      // Note: In a real deployment, this would be saved to the server
      toast.success(newValue ? 'Auto-update enabled' : 'Auto-update disabled')
    } catch (error) {
      console.error('Error saving preference:', error)
    }
  }

  useEffect(() => {
    loadData()
    
    // Set up auto-refresh every 5 minutes if enabled
    const interval = setInterval(() => {
      if (autoUpdateEnabled) {
        loadData()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [autoUpdateEnabled])

  // Filter and sort data based on configuration
  const filteredReits = reits
    .filter(r => r.price <= maxPrice && r.yield >= minYield)
    .sort((a, b) => b.yield - a.yield)
    .slice(0, topCount)

  const filteredEtfs = etfs
    .filter(e => e.price <= maxPrice && e.yield >= minYield)
    .sort((a, b) => b.yield - a.yield)
    .slice(0, topCount)

  // Prepare chart data
  const prepareChartData = (histories: Record<string, HistoryData>, tickers: string[]): ChartDataPoint[] => {
    const data: ChartDataPoint[] = []
    const maxLength = Math.max(...tickers.map(t => histories[t]?.dates?.length || 0))
    
    for (let i = 0; i < maxLength; i++) {
      const point: ChartDataPoint = { date: '' }
      tickers.forEach(ticker => {
        const hist = histories[ticker]
        if (hist && hist.dates[i]) {
          point.date = hist.dates[i]
          point[ticker] = hist.prices[i]
        }
      })
      if (point.date) {
        data.push(point)
      }
    }
    return data
  }

  const reitChartData = prepareChartData(reitHistories, filteredReits.map(r => r.ticker))
  const etfChartData = prepareChartData(etfHistories, filteredEtfs.map(e => e.ticker))

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Calculate next weekday update
  const getNextWeekdayUpdate = () => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    
    // If it's after 9 PM UTC (4-5 PM ET) on a weekday, next update is tomorrow
    // If it's weekend, next update is Monday
    let nextUpdate = new Date(now)
    nextUpdate.setHours(21, 0, 0, 0) // 9 PM UTC
    
    if (day === 0) { // Sunday
      nextUpdate.setDate(now.getDate() + 1) // Monday
    } else if (day === 6) { // Saturday
      nextUpdate.setDate(now.getDate() + 2) // Monday
    } else if (hour >= 21) { // After 9 PM on weekday
      if (day === 5) { // Friday
        nextUpdate.setDate(now.getDate() + 3) // Monday
      } else {
        nextUpdate.setDate(now.getDate() + 1) // Next day
      }
    }
    
    return nextUpdate.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">High Yield Dashboard</h1>
                <p className="text-slate-400 text-sm">Top REITs & ETFs Under ${maxPrice}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Auto-update status */}
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
                {autoUpdateEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div className="hidden sm:block">
                      <p className="text-emerald-400 text-xs font-medium">Auto-Update ON</p>
                      <p className="text-slate-500 text-xs">Weekdays 9PM UTC</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <div className="hidden sm:block">
                      <p className="text-amber-400 text-xs font-medium">Auto-Update OFF</p>
                      <p className="text-slate-500 text-xs">Manual updates only</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-right hidden md:block">
                <p className="text-slate-400 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last Updated
                </p>
                <p className="text-emerald-400 text-sm font-medium">{lastUpdated}</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* Auto-update toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <Label className="text-white font-medium">Auto-Update</Label>
                        <p className="text-slate-400 text-xs">Fetch data weekdays at 9PM UTC</p>
                      </div>
                      <Switch 
                        checked={autoUpdateEnabled} 
                        onCheckedChange={toggleAutoUpdate}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300 text-sm">Max Price ($)</Label>
                        <Input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="bg-slate-900 border-slate-600 text-white mt-1"
                          min={1}
                          max={1000}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Top Items</Label>
                        <Input
                          type="number"
                          value={topCount}
                          onChange={(e) => setTopCount(Number(e.target.value))}
                          className="bg-slate-900 border-slate-600 text-white mt-1"
                          min={1}
                          max={10}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-slate-300 text-sm">Minimum Yield (%)</Label>
                      <Input
                        type="number"
                        value={minYield}
                        onChange={(e) => setMinYield(Number(e.target.value))}
                        className="bg-slate-900 border-slate-600 text-white mt-1"
                        min={0}
                        max={50}
                        step={0.5}
                      />
                    </div>
                    
                    {/* Schedule info */}
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                        <Calendar className="w-4 h-4" />
                        Update Schedule
                      </div>
                      <p className="text-white text-sm">
                        {autoUpdateEnabled 
                          ? `Next update: ${getNextWeekdayUpdate()}`
                          : 'Auto-update is disabled'
                        }
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Updates run Monday-Friday at 9:00 PM UTC
                        (4-5 PM ET depending on DST)
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/50 text-emerald-400 px-3 py-1">
            <CheckCircle className="w-3 h-3 mr-1" />
            Auto-Update {autoUpdateEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50 text-blue-400 px-3 py-1">
            <Calendar className="w-3 h-3 mr-1" />
            Weekdays Only
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/50 text-purple-400 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" />
            9:00 PM UTC
          </Badge>
        </div>

        <Tabs defaultValue="reits" className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger value="reits" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              REITs
            </TabsTrigger>
            <TabsTrigger value="etfs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              ETFs
            </TabsTrigger>
            <TabsTrigger value="charts" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Trend Charts
            </TabsTrigger>
          </TabsList>

          {/* REITs Tab */}
          <TabsContent value="reits" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Top {topCount} REITs Under ${maxPrice}
              </h2>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                {filteredReits.length} Found
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReits.map((reit, index) => (
                <Card 
                  key={reit.ticker} 
                  className={`bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-all duration-300 ${
                    index === 0 ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {reit.ticker}
                          {index === 0 && (
                            <Badge className="bg-emerald-600 text-white text-xs">
                              #1 TOP
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{reit.name}</p>
                      </div>
                      <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <DollarSign className="w-4 h-4" />
                          Price
                        </div>
                        <p className="text-2xl font-bold text-white">${reit.price.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <Percent className="w-4 h-4" />
                          Yield
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{reit.yield.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700">
                      <p className="text-slate-400 text-sm">{reit.sector}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReits.length === 0 && (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                <p className="text-slate-400">No REITs found matching your criteria</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </TabsContent>

          {/* ETFs Tab */}
          <TabsContent value="etfs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                Top {topCount} ETFs Under ${maxPrice}
              </h2>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {filteredEtfs.length} Found
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEtfs.map((etf, index) => (
                <Card 
                  key={etf.ticker} 
                  className={`bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-all duration-300 ${
                    index === 0 ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {etf.ticker}
                          {index === 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              #1 TOP
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{etf.name}</p>
                      </div>
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <DollarSign className="w-4 h-4" />
                          Price
                        </div>
                        <p className="text-2xl font-bold text-white">${etf.price.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <Percent className="w-4 h-4" />
                          Yield
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{etf.yield.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700">
                      <p className="text-slate-400 text-sm">{etf.category}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEtfs.length === 0 && (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                <p className="text-slate-400">No ETFs found matching your criteria</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            {/* REITs Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  REITs Price Trends (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reitChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Legend />
                      {filteredReits.map((reit, index) => (
                        <Line
                          key={reit.ticker}
                          type="monotone"
                          dataKey={reit.ticker}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          name={`${reit.ticker} ($${reit.price.toFixed(2)})`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ETFs Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  ETFs Price Trends (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={etfChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Legend />
                      {filteredEtfs.map((etf, index) => (
                        <Line
                          key={etf.ticker}
                          type="monotone"
                          dataKey={etf.ticker}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={false}
                          name={`${etf.ticker} ($${etf.price.toFixed(2)})`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">Top REIT Yield</p>
              <p className="text-2xl font-bold text-emerald-400">
                {filteredReits.length > 0 ? `${filteredReits[0].yield.toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-slate-500 text-xs">
                {filteredReits.length > 0 ? filteredReits[0].ticker : ''}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">Top ETF Yield</p>
              <p className="text-2xl font-bold text-blue-400">
                {filteredEtfs.length > 0 ? `${filteredEtfs[0].yield.toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-slate-500 text-xs">
                {filteredEtfs.length > 0 ? filteredEtfs[0].ticker : ''}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">REITs Under ${maxPrice}</p>
              <p className="text-2xl font-bold text-white">{reits.filter(r => r.price <= maxPrice).length}</p>
              <p className="text-slate-500 text-xs">Available</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm">ETFs Under ${maxPrice}</p>
              <p className="text-2xl font-bold text-white">{etfs.filter(e => e.price <= maxPrice).length}</p>
              <p className="text-slate-500 text-xs">Available</p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm text-center md:text-left">
              Data provided by Yahoo Finance. For informational purposes only. Not financial advice.
            </p>
            <div className="flex items-center gap-4 text-slate-600 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last: {lastUpdated}
              </span>
              {autoUpdateEnabled && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Next: {nextUpdate || getNextWeekdayUpdate()}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
