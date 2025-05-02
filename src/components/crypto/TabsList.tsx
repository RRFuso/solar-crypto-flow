
import { Tabs, TabsList as ShadcnTabsList, TabsTrigger } from "@/components/ui/tabs";

type TabsListProps = {
  activeTab: string;
  onTabChange: (value: string) => void;
};

const TabsList = ({ activeTab, onTabChange }: TabsListProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <ShadcnTabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full">
        <TabsTrigger value="outperforming">Destaques</TabsTrigger>
        <TabsTrigger value="bullish">Alta</TabsTrigger>
        <TabsTrigger value="bearish">Baixa</TabsTrigger>
        <TabsTrigger value="overbought">Sobrecomprado</TabsTrigger>
        <TabsTrigger value="oversold">Sobrevendido</TabsTrigger>
        <TabsTrigger value="div-bull">Divergência Bull</TabsTrigger>
        <TabsTrigger value="div-bear">Divergência Bear</TabsTrigger>
      </ShadcnTabsList>
    </Tabs>
  );
};

export default TabsList;
