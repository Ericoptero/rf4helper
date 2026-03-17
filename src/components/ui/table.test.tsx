import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from '@/components/ui/table';

describe('Table Component', () => {
  it('renders table structure correctly', () => {
    render(
      <Table data-testid="table">
        <TableCaption>A list of items.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow data-testid="table-row">
            <TableCell>Iron</TableCell>
            <TableCell>100G</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>100G</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByText('A list of items.')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Iron')).toBeInTheDocument();
    expect(screen.getAllByText('100G')).toHaveLength(2);
    expect(screen.getByTestId('table-row')).toBeInTheDocument();
  });
});
