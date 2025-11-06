declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface UserOptions {
    head?: any[][];
    body?: any[][];
    startY?: number;
    styles?: any;
    headStyles?: any;
    columnStyles?: any;
    theme?: 'striped' | 'grid' | 'plain';
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void;
}
