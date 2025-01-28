import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ExplosiveTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Par</TableHead>
        <TableHead>Performance</TableHead>
        <TableHead>Volume 24h</TableHead>
        <TableHead>RSI 4h</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ExplosiveTableHeader;