import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ExplosiveTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Par</TableHead>
        <TableHead>Variação</TableHead>
        <TableHead>Volume</TableHead>
        <TableHead>RSI 4h</TableHead>
        <TableHead>Critérios</TableHead>
        <TableHead>Score</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ExplosiveTableHeader;