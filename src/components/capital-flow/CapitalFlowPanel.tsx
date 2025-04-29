
const CapitalFlowPanel = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const [zoomLevel, setZoomLevel] = useState(40); // Zoom inicial ajustado para 40%
  const [flowLimit, setFlowLimit] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const { data: flowData, isLoading, error, refetch } = useQuery({
    queryKey: ['capital-flow', timeframe],
    queryFn: () => fetchMarketData(timeframe),
    refetchInterval: 30000,
    meta: {
      onError: () => {
        toast({
          title: "Error fetching data",
          description: "Failed to fetch market data. Please try again later.",
          variant: "destructive"
        });
      }
    }
  });

  // ...
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 10)); // Agora permite zoom mínimo de 10%
  };
