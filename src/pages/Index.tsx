
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SolarCryptoPanel from "@/components/solar-crypto/SolarCryptoPanel";

const Index: React.FC = () => {
  return (
    <DashboardLayout>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <SolarCryptoPanel />
      </main>
    </DashboardLayout>
  );
};

export default Index;
