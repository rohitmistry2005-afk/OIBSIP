import React, { useState, useMemo, useEffect } from 'react';
import { getAdminInventory, updateInventoryItem } from './services/adminApi';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit2,
  Info,
  Leaf,
  MoreHorizontal,
  Package,
  Plus,
  Power,
  RotateCcw,
  Save,
  Search,
  User,
  X,
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Vegetables' | 'Dairy' | 'Bakery' | 'Herbs' | 'Meat' | 'Packaging' | 'Condiments' | 'Beverages' | 'Others';
  subCategory: 'Ingredients' | 'Packaging' | 'Beverages' | 'Others';
  currentStock: number;
  unit: string;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  description: string;
  sku: string;
  supplier: string;
  costPerUnit: number;
  lastPurchased: string;
  active: boolean;
  image: string;
  history: {
    date: string;
    change: string;
    previousStock: number;
    newStock: number;
    reason: string;
  }[];
}

const INITIAL_INVENTORY: InventoryItem[] = [
  // 1. Tomatoes
  {
    id: 'inv-1',
    name: 'Tomatoes',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 12,
    unit: 'kg',
    threshold: 10,
    status: 'In Stock',
    lastUpdated: 'Sep 14, 2026 10:24 AM',
    description: 'Fresh, ripe tomatoes used for pizza toppings. Store in a cool, dry place.',
    sku: 'VEG-TOM-001',
    supplier: 'FreshFarms Co.',
    costPerUnit: 45,
    lastPurchased: 'Sep 10, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 14, 2026 10:24 AM', change: '+5 kg', previousStock: 7, newStock: 12, reason: 'Restock from supplier PO-408' },
      { date: 'Sep 12, 2026 06:15 PM', change: '-4 kg', previousStock: 11, newStock: 7, reason: 'Kitchen prep batch #92' },
      { date: 'Sep 10, 2026 09:00 AM', change: '+10 kg', previousStock: 1, newStock: 11, reason: 'Bulk shipment FreshFarms' },
    ],
  },
  // 2. Mozzarella Cheese
  {
    id: 'inv-2',
    name: 'Mozzarella Cheese',
    category: 'Dairy',
    subCategory: 'Ingredients',
    currentStock: 2,
    unit: 'kg',
    threshold: 5,
    status: 'Low Stock',
    lastUpdated: 'Sep 14, 2026 09:12 AM',
    description: 'Signature whole-milk shredded mozzarella for authentic stretch and flavour.',
    sku: 'DAI-MOZ-002',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 340,
    lastPurchased: 'Sep 08, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 14, 2026 09:12 AM', change: '-3 kg', previousStock: 5, newStock: 2, reason: 'Lunch rush kitchen dispatch' },
      { date: 'Sep 11, 2026 02:00 PM', change: '-4 kg', previousStock: 9, newStock: 5, reason: 'Standard usage' },
    ],
  },
  // 3. Pizza Dough
  {
    id: 'inv-3',
    name: 'Pizza Dough',
    category: 'Bakery',
    subCategory: 'Ingredients',
    currentStock: 0,
    unit: 'pcs',
    threshold: 10,
    status: 'Out of Stock',
    lastUpdated: 'Sep 13, 2026 08:45 PM',
    description: 'Slow-fermented 24-hour dough balls ready for hand stretching.',
    sku: 'BAK-DOU-003',
    supplier: 'BakerCraft',
    costPerUnit: 22,
    lastPurchased: 'Sep 11, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/6287519/pexels-photo-6287519.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 13, 2026 08:45 PM', change: '-8 pcs', previousStock: 8, newStock: 0, reason: 'Dinner rush complete exhaustion' },
    ],
  },
  // 4. Fresh Basil
  {
    id: 'inv-4',
    name: 'Fresh Basil',
    category: 'Herbs',
    subCategory: 'Ingredients',
    currentStock: 1,
    unit: 'kg',
    threshold: 3,
    status: 'Low Stock',
    lastUpdated: 'Sep 14, 2026 11:02 AM',
    description: 'Hydroponic aromatic Italian sweet basil leaves for fresh Margherita garnishing.',
    sku: 'HRB-BAS-004',
    supplier: 'GreenLeaf Organic',
    costPerUnit: 180,
    lastPurchased: 'Sep 12, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1087902/pexels-photo-1087902.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 14, 2026 11:02 AM', change: '-1 kg', previousStock: 2, newStock: 1, reason: 'Daily prep station allotment' },
    ],
  },
  // 5. Pepperoni
  {
    id: 'inv-5',
    name: 'Pepperoni',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 8,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 04:20 PM',
    description: 'Cured, seasoned beef and poultry pepperoni slices with paprika and chili.',
    sku: 'MEA-PEP-005',
    supplier: 'MeatMasters',
    costPerUnit: 480,
    lastPurchased: 'Sep 09, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4109128/pexels-photo-4109128.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 13, 2026 04:20 PM', change: '-2 kg', previousStock: 10, newStock: 8, reason: 'Pizza assembly usage' },
    ],
  },
  // 6. Pizza Box (12")
  {
    id: 'inv-6',
    name: 'Pizza Box (12")',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 50,
    unit: 'pcs',
    threshold: 20,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 02:18 PM',
    description: 'Ventilated corrugated food-safe Kraft cardboard boxes for large pizzas.',
    sku: 'PKG-BOX-006',
    supplier: 'PackPro Ltd.',
    costPerUnit: 14,
    lastPurchased: 'Sep 05, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 12, 2026 02:18 PM', change: '+100 pcs', previousStock: 22, newStock: 122, reason: 'Supplier delivery' },
    ],
  },
  // 7. Olive Oil
  {
    id: 'inv-7',
    name: 'Olive Oil',
    category: 'Condiments',
    subCategory: 'Ingredients',
    currentStock: 3,
    unit: 'L',
    threshold: 5,
    status: 'Low Stock',
    lastUpdated: 'Sep 14, 2026 01:05 PM',
    description: 'Extra virgin cold-pressed olive oil used in dough prep and finishing drizzle.',
    sku: 'CND-OIL-007',
    supplier: 'PureOils Inc.',
    costPerUnit: 650,
    lastPurchased: 'Sep 07, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1022385/pexels-photo-1022385.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 14, 2026 01:05 PM', change: '-1 L', previousStock: 4, newStock: 3, reason: 'Sauce batch preparation' },
    ],
  },
  // 8. Mushrooms
  {
    id: 'inv-8',
    name: 'Mushrooms',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 15,
    unit: 'kg',
    threshold: 10,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 09:30 AM',
    description: 'Fresh white button mushrooms, sliced and washed daily for Farmhouse pizzas.',
    sku: 'VEG-MSH-008',
    supplier: 'FreshFarms Co.',
    costPerUnit: 120,
    lastPurchased: 'Sep 11, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/259648/pexels-photo-259648.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 13, 2026 09:30 AM', change: '+8 kg', previousStock: 7, newStock: 15, reason: 'Weekly vegetable intake' },
    ],
  },
  // 9. Capsicum
  {
    id: 'inv-9',
    name: 'Capsicum',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 4,
    unit: 'kg',
    threshold: 5,
    status: 'Low Stock',
    lastUpdated: 'Sep 14, 2026 12:14 PM',
    description: 'Crisp green bell peppers, diced for supreme toppings.',
    sku: 'VEG-CAP-009',
    supplier: 'FreshFarms Co.',
    costPerUnit: 60,
    lastPurchased: 'Sep 12, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/2893635/pexels-photo-2893635.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 14, 2026 12:14 PM', change: '-2 kg', previousStock: 6, newStock: 4, reason: 'Prep counter restock' },
    ],
  },
  // 10. Coca-Cola Can
  {
    id: 'inv-10',
    name: 'Coca-Cola Can',
    category: 'Beverages',
    subCategory: 'Beverages',
    currentStock: 24,
    unit: 'pcs',
    threshold: 10,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 05:22 PM',
    description: '330ml chilled carbonated soft drink cans for customer orders.',
    sku: 'BEV-COC-010',
    supplier: 'GlobalBev Co.',
    costPerUnit: 28,
    lastPurchased: 'Sep 06, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [
      { date: 'Sep 12, 2026 05:22 PM', change: '-12 pcs', previousStock: 36, newStock: 24, reason: 'Evening delivery dispatches' },
    ],
  },
  // 11-15 Vegetables
  {
    id: 'inv-11',
    name: 'Red Onions',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 22,
    unit: 'kg',
    threshold: 10,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 11:45 AM',
    description: 'Finely sliced red onions for Farmhouse and Chicken Feast.',
    sku: 'VEG-ONI-011',
    supplier: 'FreshFarms Co.',
    costPerUnit: 35,
    lastPurchased: 'Sep 10, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/144206/pexels-photo-144206.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-12',
    name: 'Jalapeños Pickled',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 3,
    unit: 'kg',
    threshold: 5,
    status: 'Low Stock',
    lastUpdated: 'Sep 14, 2026 08:30 AM',
    description: 'Zesty sliced green jalapeños in seasoned vinegar brine.',
    sku: 'VEG-JAL-012',
    supplier: 'SpiceWorks',
    costPerUnit: 140,
    lastPurchased: 'Sep 07, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/208537/pexels-photo-208537.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-13',
    name: 'Sweet Corn Kernels',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 18,
    unit: 'kg',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 03:10 PM',
    description: 'Tender golden sweet corn kernels, pre-steamed and frozen.',
    sku: 'VEG-CRN-013',
    supplier: 'FreshFarms Co.',
    costPerUnit: 85,
    lastPurchased: 'Sep 09, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-14',
    name: 'Black Olives Sliced',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 14,
    unit: 'kg',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 01:20 PM',
    description: 'Pitted Mediterranean black olives in light brine.',
    sku: 'VEG-OLV-014',
    supplier: 'PureOils Inc.',
    costPerUnit: 260,
    lastPurchased: 'Sep 05, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-15',
    name: 'Red Paprika',
    category: 'Vegetables',
    subCategory: 'Ingredients',
    currentStock: 11,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 10:00 AM',
    description: 'Diced sweet red peppers for colourful spicy bursts.',
    sku: 'VEG-PAP-015',
    supplier: 'FreshFarms Co.',
    costPerUnit: 90,
    lastPurchased: 'Sep 11, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 16-19 Dairy
  {
    id: 'inv-16',
    name: 'Cheddar Cheese Block',
    category: 'Dairy',
    subCategory: 'Ingredients',
    currentStock: 14,
    unit: 'kg',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 11:20 AM',
    description: 'Aged sharp orange cheddar for four-cheese blends.',
    sku: 'DAI-CHD-016',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 380,
    lastPurchased: 'Sep 08, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/773253/pexels-photo-773253.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-17',
    name: 'Parmesan Grated',
    category: 'Dairy',
    subCategory: 'Ingredients',
    currentStock: 6,
    unit: 'kg',
    threshold: 4,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 04:30 PM',
    description: 'Finely grated authentic parmesan for crust dusting.',
    sku: 'DAI-PAR-017',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 620,
    lastPurchased: 'Sep 06, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-18',
    name: 'Fresh Paneer Cubes',
    category: 'Dairy',
    subCategory: 'Ingredients',
    currentStock: 9,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 14, 2026 07:15 AM',
    description: 'Soft cottage cheese cubes marinated in tandoori spices.',
    sku: 'DAI-PAN-018',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 240,
    lastPurchased: 'Sep 13, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/34407073/pexels-photo-34407073.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-19',
    name: 'Salted Butter',
    category: 'Dairy',
    subCategory: 'Ingredients',
    currentStock: 11,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 10, 2026 01:10 PM',
    description: 'Creamy salted butter used for garlic bread glaze.',
    sku: 'DAI-BUT-019',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 290,
    lastPurchased: 'Sep 07, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 20-21 Bakery
  {
    id: 'inv-20',
    name: 'Garlic Bread Baguettes',
    category: 'Bakery',
    subCategory: 'Ingredients',
    currentStock: 16,
    unit: 'pcs',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 05:40 PM',
    description: 'Par-baked herb baguettes sliced for cheesy garlic bread.',
    sku: 'BAK-GLC-020',
    supplier: 'BakerCraft',
    costPerUnit: 38,
    lastPurchased: 'Sep 12, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/208537/pexels-photo-208537.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-21',
    name: 'Artisan Flour (Tipo 00)',
    category: 'Bakery',
    subCategory: 'Ingredients',
    currentStock: 45,
    unit: 'kg',
    threshold: 20,
    status: 'In Stock',
    lastUpdated: 'Sep 09, 2026 12:00 PM',
    description: 'Finely ground wheat flour with high gluten index.',
    sku: 'BAK-FLR-021',
    supplier: 'BakerCraft',
    costPerUnit: 52,
    lastPurchased: 'Sep 04, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/6287519/pexels-photo-6287519.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 22-25 Herbs & Seasonings
  {
    id: 'inv-22',
    name: 'Dried Oregano',
    category: 'Herbs',
    subCategory: 'Ingredients',
    currentStock: 6,
    unit: 'kg',
    threshold: 3,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 09:20 AM',
    description: 'Crushed Greek oregano leaves with high volatile oil aroma.',
    sku: 'HRB-ORG-022',
    supplier: 'SpiceWorks',
    costPerUnit: 220,
    lastPurchased: 'Sep 06, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1087902/pexels-photo-1087902.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-23',
    name: 'Red Chili Flakes',
    category: 'Herbs',
    subCategory: 'Ingredients',
    currentStock: 8,
    unit: 'kg',
    threshold: 3,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 02:40 PM',
    description: 'Crushed dried red chili flakes for tabletop sachets and prep.',
    sku: 'HRB-CHL-023',
    supplier: 'SpiceWorks',
    costPerUnit: 160,
    lastPurchased: 'Sep 05, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-24',
    name: 'Italian Seasoning Mix',
    category: 'Herbs',
    subCategory: 'Ingredients',
    currentStock: 5,
    unit: 'kg',
    threshold: 2,
    status: 'In Stock',
    lastUpdated: 'Sep 10, 2026 11:00 AM',
    description: 'House proprietary blend of rosemary, thyme, marjoram and basil.',
    sku: 'HRB-ITL-024',
    supplier: 'SpiceWorks',
    costPerUnit: 250,
    lastPurchased: 'Sep 02, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1087902/pexels-photo-1087902.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-25',
    name: 'Fresh Rosemary Sprigs',
    category: 'Herbs',
    subCategory: 'Ingredients',
    currentStock: 0,
    unit: 'kg',
    threshold: 2,
    status: 'Out of Stock',
    lastUpdated: 'Sep 13, 2026 06:10 PM',
    description: 'Organic rosemary sprigs for focaccia and gourmet seasonal pies.',
    sku: 'HRB-RSM-025',
    supplier: 'GreenLeaf Organic',
    costPerUnit: 210,
    lastPurchased: 'Sep 08, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1087902/pexels-photo-1087902.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 26-30 Meat
  {
    id: 'inv-26',
    name: 'Grilled Chicken Chunks',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 12,
    unit: 'kg',
    threshold: 6,
    status: 'In Stock',
    lastUpdated: 'Sep 14, 2026 08:50 AM',
    description: 'Herb-marinated oven-roasted boneless chicken breast chunks.',
    sku: 'MEA-CHK-026',
    supplier: 'MeatMasters',
    costPerUnit: 320,
    lastPurchased: 'Sep 13, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-27',
    name: 'Chicken Sausages Sliced',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 7,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 01:15 PM',
    description: 'Smoked cocktail chicken sausages pre-sliced in rounds.',
    sku: 'MEA-SAU-027',
    supplier: 'MeatMasters',
    costPerUnit: 280,
    lastPurchased: 'Sep 10, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-28',
    name: 'Crispy Bacon Strips',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 0,
    unit: 'kg',
    threshold: 4,
    status: 'Out of Stock',
    lastUpdated: 'Sep 13, 2026 09:30 PM',
    description: 'Hickory wood-smoked crispy bacon strips for meat feast toppings.',
    sku: 'MEA-BAC-028',
    supplier: 'MeatMasters',
    costPerUnit: 520,
    lastPurchased: 'Sep 07, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4109128/pexels-photo-4109128.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-29',
    name: 'BBQ Chicken Strips',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 9,
    unit: 'kg',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 03:20 PM',
    description: 'Slow-cooked chicken tossed in smoky hickory BBQ sauce.',
    sku: 'MEA-BBQ-029',
    supplier: 'MeatMasters',
    costPerUnit: 340,
    lastPurchased: 'Sep 11, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/19786200/pexels-photo-19786200.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-30',
    name: 'Ham Slices Cooked',
    category: 'Meat',
    subCategory: 'Ingredients',
    currentStock: 6,
    unit: 'kg',
    threshold: 4,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 04:00 PM',
    description: 'Thin cut deli-style poultry ham for classic Hawaiian pizzas.',
    sku: 'MEA-HAM-030',
    supplier: 'MeatMasters',
    costPerUnit: 310,
    lastPurchased: 'Sep 08, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4109128/pexels-photo-4109128.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 31-32 Condiments
  {
    id: 'inv-31',
    name: 'Signature Tomato Sauce',
    category: 'Condiments',
    subCategory: 'Ingredients',
    currentStock: 28,
    unit: 'L',
    threshold: 12,
    status: 'In Stock',
    lastUpdated: 'Sep 14, 2026 06:45 AM',
    description: 'San Marzano-style crushed tomato base with garlic, basil and sea salt.',
    sku: 'CND-SAU-031',
    supplier: 'PureOils Inc.',
    costPerUnit: 95,
    lastPurchased: 'Sep 12, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-32',
    name: 'Creamy Alfredo Sauce',
    category: 'Condiments',
    subCategory: 'Ingredients',
    currentStock: 10,
    unit: 'L',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 02:10 PM',
    description: 'Rich white sauce crafted from heavy cream, butter and parmesan.',
    sku: 'CND-ALF-032',
    supplier: 'DairyFresh Ltd.',
    costPerUnit: 140,
    lastPurchased: 'Sep 09, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 33-40 Packaging
  {
    id: 'inv-33',
    name: 'Pizza Box (10")',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 65,
    unit: 'pcs',
    threshold: 20,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 02:30 PM',
    description: 'Medium pizza delivery boxes with branded PizzaDelight print.',
    sku: 'PKG-BX1-033',
    supplier: 'PackPro Ltd.',
    costPerUnit: 12,
    lastPurchased: 'Sep 05, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-34',
    name: 'Pizza Box (7")',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 40,
    unit: 'pcs',
    threshold: 15,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 10:20 AM',
    description: 'Regular individual personal pizza delivery boxes.',
    sku: 'PKG-BX2-034',
    supplier: 'PackPro Ltd.',
    costPerUnit: 9,
    lastPurchased: 'Sep 05, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-35',
    name: 'Kraft Beverage Carry Bags',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 120,
    unit: 'pcs',
    threshold: 40,
    status: 'In Stock',
    lastUpdated: 'Sep 09, 2026 04:15 PM',
    description: 'Heavy duty brown kraft paper carrier bags with reinforced handles.',
    sku: 'PKG-BAG-035',
    supplier: 'PackPro Ltd.',
    costPerUnit: 6,
    lastPurchased: 'Sep 01, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-36',
    name: 'Eco Paper Napkins Pack',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 350,
    unit: 'pcs',
    threshold: 100,
    status: 'In Stock',
    lastUpdated: 'Sep 08, 2026 11:30 AM',
    description: '2-ply recycled tissue napkins stamped with brand logo.',
    sku: 'PKG-NPK-036',
    supplier: 'PackPro Ltd.',
    costPerUnit: 1.2,
    lastPurchased: 'Aug 29, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-37',
    name: 'Clear Dip Cups with Lids',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 180,
    unit: 'pcs',
    threshold: 60,
    status: 'In Stock',
    lastUpdated: 'Sep 10, 2026 03:00 PM',
    description: '50ml portion containers for garlic and cheese dips.',
    sku: 'PKG-CUP-037',
    supplier: 'PackPro Ltd.',
    costPerUnit: 2.5,
    lastPurchased: 'Sep 02, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-38',
    name: 'Tamper Proof Pizza Tape',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 14,
    unit: 'pcs',
    threshold: 5,
    status: 'In Stock',
    lastUpdated: 'Sep 06, 2026 09:10 AM',
    description: 'Security seal tape for box flaps to guarantee untouched delivery.',
    sku: 'PKG-TPE-038',
    supplier: 'PackPro Ltd.',
    costPerUnit: 45,
    lastPurchased: 'Aug 26, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-39',
    name: 'Thermal Hot Bags',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 8,
    unit: 'pcs',
    threshold: 3,
    status: 'In Stock',
    lastUpdated: 'Sep 04, 2026 02:20 PM',
    description: 'Insulated nylon rider bags for temperature retention up to 45 mins.',
    sku: 'PKG-BAG-039',
    supplier: 'PackPro Ltd.',
    costPerUnit: 680,
    lastPurchased: 'Aug 20, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-40',
    name: 'Aluminium Foil Roll (50m)',
    category: 'Packaging',
    subCategory: 'Packaging',
    currentStock: 12,
    unit: 'pcs',
    threshold: 4,
    status: 'In Stock',
    lastUpdated: 'Sep 07, 2026 12:40 PM',
    description: 'Heavy duty kitchen grade foil for baking garlic bread.',
    sku: 'PKG-FOL-040',
    supplier: 'PackPro Ltd.',
    costPerUnit: 180,
    lastPurchased: 'Aug 30, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 41-44 Beverages
  {
    id: 'inv-41',
    name: 'Pepsi Bottle (500ml)',
    category: 'Beverages',
    subCategory: 'Beverages',
    currentStock: 32,
    unit: 'pcs',
    threshold: 12,
    status: 'In Stock',
    lastUpdated: 'Sep 12, 2026 04:30 PM',
    description: 'Chilled 500ml plastic bottles for combo meals.',
    sku: 'BEV-PEP-041',
    supplier: 'GlobalBev Co.',
    costPerUnit: 34,
    lastPurchased: 'Sep 06, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-42',
    name: 'Sprite Lemon Can (330ml)',
    category: 'Beverages',
    subCategory: 'Beverages',
    currentStock: 18,
    unit: 'pcs',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 11, 2026 01:10 PM',
    description: 'Refreshing lemon-lime carbonated soda cans.',
    sku: 'BEV-SPR-042',
    supplier: 'GlobalBev Co.',
    costPerUnit: 28,
    lastPurchased: 'Sep 04, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-43',
    name: 'Mirinda Orange Can (330ml)',
    category: 'Beverages',
    subCategory: 'Beverages',
    currentStock: 15,
    unit: 'pcs',
    threshold: 8,
    status: 'In Stock',
    lastUpdated: 'Sep 10, 2026 03:45 PM',
    description: 'Tangy orange flavour carbonated beverage.',
    sku: 'BEV-MIR-043',
    supplier: 'GlobalBev Co.',
    costPerUnit: 28,
    lastPurchased: 'Sep 04, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-44',
    name: 'Mineral Water (1L)',
    category: 'Beverages',
    subCategory: 'Beverages',
    currentStock: 40,
    unit: 'pcs',
    threshold: 15,
    status: 'In Stock',
    lastUpdated: 'Sep 13, 2026 11:15 AM',
    description: 'Purified drinking water bottles with added minerals.',
    sku: 'BEV-WTR-044',
    supplier: 'GlobalBev Co.',
    costPerUnit: 12,
    lastPurchased: 'Sep 08, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  // 45-48 Others & Supplies
  {
    id: 'inv-45',
    name: 'Kitchen Sanitizer Can (5L)',
    category: 'Others',
    subCategory: 'Others',
    currentStock: 4,
    unit: 'pcs',
    threshold: 2,
    status: 'In Stock',
    lastUpdated: 'Sep 09, 2026 10:15 AM',
    description: 'Food grade quaternary disinfectant for prep tables and knife stations.',
    sku: 'OTH-SAN-045',
    supplier: 'PackPro Ltd.',
    costPerUnit: 420,
    lastPurchased: 'Aug 28, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-46',
    name: 'Food Grade Nitrile Gloves (Box of 100)',
    category: 'Others',
    subCategory: 'Others',
    currentStock: 12,
    unit: 'pcs',
    threshold: 4,
    status: 'In Stock',
    lastUpdated: 'Sep 08, 2026 03:50 PM',
    description: 'Powder-free disposable blue nitrile gloves, size M.',
    sku: 'OTH-GLV-046',
    supplier: 'PackPro Ltd.',
    costPerUnit: 290,
    lastPurchased: 'Aug 27, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-47',
    name: 'Parchment Baking Sheets',
    category: 'Others',
    subCategory: 'Others',
    currentStock: 80,
    unit: 'pcs',
    threshold: 30,
    status: 'In Stock',
    lastUpdated: 'Sep 07, 2026 01:20 PM',
    description: 'Pre-cut siliconized baking sheets for high temperature deck ovens.',
    sku: 'OTH-BKS-047',
    supplier: 'BakerCraft',
    costPerUnit: 4,
    lastPurchased: 'Aug 25, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
  {
    id: 'inv-48',
    name: 'Receipt Thermal Paper Rolls',
    category: 'Others',
    subCategory: 'Others',
    currentStock: 25,
    unit: 'pcs',
    threshold: 10,
    status: 'In Stock',
    lastUpdated: 'Sep 06, 2026 04:00 PM',
    description: '80mm BPA-free thermal rolls for POS and kitchen ticket printers.',
    sku: 'OTH-POS-048',
    supplier: 'PackPro Ltd.',
    costPerUnit: 35,
    lastPurchased: 'Aug 22, 2026',
    active: true,
    image: 'https://images.pexels.com/photos/4392875/pexels-photo-4392875.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
    history: [],
  },
];

interface AdminInventoryProps {
  onNavigate?: (path: string) => void;
}

export function AdminInventory({ onNavigate }: AdminInventoryProps = {}) {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('All Items');

  // Load real backend inventory on mount
  useEffect(() => {
    let isMounted = true;
    getAdminInventory()
      .then((res) => {
        if (isMounted && res.success && res.data?.inventory?.length) {
          const backendItems: InventoryItem[] = res.data.inventory.map((b) => ({
            id: b._id,
            name: b.name,
            category:
              b.category === 'base'
                ? 'Bakery'
                : b.category === 'sauce'
                ? 'Condiments'
                : b.category === 'cheese'
                ? 'Dairy'
                : 'Vegetables',
            subCategory: 'Ingredients',
            currentStock: b.quantity,
            unit: b.unit || 'units',
            threshold: b.threshold,
            status:
              b.quantity === 0
                ? 'Out of Stock'
                : b.quantity <= b.threshold
                ? 'Low Stock'
                : 'In Stock',
            lastUpdated: b.updatedAt ? new Date(b.updatedAt).toLocaleString() : 'Recent',
            description: `Backend ingredient: ${b.name} (${b.category})`,
            sku: `ING-${b.itemId.toUpperCase()}`,
            supplier: 'PizzaDelight Commissary',
            costPerUnit: 50,
            lastPurchased: 'Active Stock',
            active: true,
            image:
              'https://images.pexels.com/photos/1435895/pexels-photo-1435895.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
            history: [],
          }));
          setItems(backendItems);
          if (backendItems[0]) {
            setSelectedItem(backendItems[0]);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(true); // Open by default matching reference screenshot
  const [drawerMode, setDrawerMode] = useState<'edit' | 'add'>('edit');
  const [selectedItem, setSelectedItem] = useState<InventoryItem>(INITIAL_INVENTORY[0]);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history' | 'supplier'>('details');

  // Drawer Form State
  const [formName, setFormName] = useState(INITIAL_INVENTORY[0].name);
  const [formCategory, setFormCategory] = useState<InventoryItem['category']>(INITIAL_INVENTORY[0].category);
  const [formDescription, setFormDescription] = useState(INITIAL_INVENTORY[0].description);
  const [formUnit, setFormUnit] = useState(INITIAL_INVENTORY[0].unit);
  const [formSku, setFormSku] = useState(INITIAL_INVENTORY[0].sku);
  const [formCurrentStock, setFormCurrentStock] = useState(INITIAL_INVENTORY[0].currentStock);
  const [formThreshold, setFormThreshold] = useState(INITIAL_INVENTORY[0].threshold);
  const [formAlertOnLow, setFormAlertOnLow] = useState(true);
  const [formSupplier, setFormSupplier] = useState(INITIAL_INVENTORY[0].supplier);
  const [formCostPerUnit, setFormCostPerUnit] = useState(INITIAL_INVENTORY[0].costPerUnit);
  const [formLastPurchased, setFormLastPurchased] = useState(INITIAL_INVENTORY[0].lastPurchased);
  const [formActive, setFormActive] = useState(INITIAL_INVENTORY[0].active);
  const [formError, setFormError] = useState<string | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Synchronize form when opening an item
  const openEditDrawer = (item: InventoryItem) => {
    setSelectedItem(item);
    setDrawerMode('edit');
    setDrawerTab('details');
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormUnit(item.unit);
    setFormSku(item.sku);
    setFormCurrentStock(item.currentStock);
    setFormThreshold(item.threshold);
    setFormAlertOnLow(true);
    setFormSupplier(item.supplier);
    setFormCostPerUnit(item.costPerUnit);
    setFormLastPurchased(item.lastPurchased);
    setFormActive(item.active);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const openAddDrawer = () => {
    setDrawerMode('add');
    setDrawerTab('details');
    setFormName('');
    setFormCategory('Vegetables');
    setFormDescription('');
    setFormUnit('kg');
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormCurrentStock(10);
    setFormThreshold(5);
    setFormAlertOnLow(true);
    setFormSupplier('FreshFarms Co.');
    setFormCostPerUnit(50);
    setFormLastPurchased('Today');
    setFormActive(true);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
  };

  // Save / Update Item Handler (honest, in-session state only)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (formCurrentStock < 0) {
      setFormError('Current stock cannot be negative.');
      return;
    }

    const calculatedStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' =
      formCurrentStock === 0
        ? 'Out of Stock'
        : formCurrentStock <= formThreshold
        ? 'Low Stock'
        : 'In Stock';

    const subCategory: InventoryItem['subCategory'] =
      formCategory === 'Packaging'
        ? 'Packaging'
        : formCategory === 'Beverages'
        ? 'Beverages'
        : formCategory === 'Others'
        ? 'Others'
        : 'Ingredients';

    const updatedTimestamp = 'Just now';

    if (drawerMode === 'edit' && selectedItem) {
      const updatedItem: InventoryItem = {
        ...selectedItem,
        name: formName.trim(),
        category: formCategory,
        subCategory,
        description: formDescription.trim(),
        unit: formUnit,
        sku: formSku.trim(),
        currentStock: Number(formCurrentStock),
        threshold: Number(formThreshold),
        status: calculatedStatus,
        lastUpdated: updatedTimestamp,
        supplier: formSupplier,
        costPerUnit: Number(formCostPerUnit),
        lastPurchased: formLastPurchased,
        active: formActive,
        history: [
          {
            date: updatedTimestamp,
            change: `${Number(formCurrentStock) - selectedItem.currentStock >= 0 ? '+' : ''}${
              Number(formCurrentStock) - selectedItem.currentStock
            } ${formUnit}`,
            previousStock: selectedItem.currentStock,
            newStock: Number(formCurrentStock),
            reason: 'Manual adjustment in local session',
          },
          ...selectedItem.history,
        ],
      };

      setItems((prev) => prev.map((it) => (it.id === selectedItem.id ? updatedItem : it)));
      setSelectedItem(updatedItem);

      // Persist to Express backend if this is a backend item
      updateInventoryItem(selectedItem.id, {
        quantity: Number(formCurrentStock),
        threshold: Number(formThreshold),
      })
        .then((res) => {
          if (res.success) {
            showToast(`Saved ${formName} to backend inventory!`);
          } else {
            showToast('Item updated locally.');
          }
        })
        .catch(() => {
          showToast('Item updated locally.');
        });
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        subCategory,
        description: formDescription.trim(),
        unit: formUnit,
        sku: formSku.trim(),
        currentStock: Number(formCurrentStock),
        threshold: Number(formThreshold),
        status: calculatedStatus,
        lastUpdated: updatedTimestamp,
        supplier: formSupplier,
        costPerUnit: Number(formCostPerUnit),
        lastPurchased: formLastPurchased,
        active: formActive,
        image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&h=160&w=160',
        history: [
          {
            date: updatedTimestamp,
            change: `+${formCurrentStock} ${formUnit}`,
            previousStock: 0,
            newStock: Number(formCurrentStock),
            reason: 'Initial inventory creation',
          },
        ],
      };

      setItems((prev) => [newItem, ...prev]);
      setSelectedItem(newItem);
      showToast('New item added for this session (local UI state only).');
    }

    setFormError(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'SubCategory', 'Stock', 'Unit', 'Threshold', 'Status', 'SKU', 'Supplier', 'CostPerUnit', 'Active'];
    const rows = filteredItems.map((it) => [
      it.id,
      `"${it.name}"`,
      it.category,
      it.subCategory,
      it.currentStock,
      it.unit,
      it.threshold,
      it.status,
      it.sku,
      `"${it.supplier}"`,
      it.costPerUnit,
      it.active ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pizzadelight-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory exported to CSV (client-side generated).');
  };

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category Tab filter
      if (activeCategoryTab !== 'All Items' && item.subCategory !== activeCategoryTab) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchSup = item.supplier.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchSku && !matchSup) {
          return false;
        }
      }

      // Category Dropdown
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      // Status Dropdown
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // Supplier Dropdown
      if (supplierFilter !== 'All' && item.supplier !== supplierFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'stockAsc') {
        return a.currentStock - b.currentStock;
      }
      if (sortBy === 'stockDesc') {
        return b.currentStock - a.currentStock;
      }
      if (sortBy === 'threshold') {
        return a.threshold - b.threshold;
      }
      return 0;
    });
  }, [items, activeCategoryTab, searchQuery, categoryFilter, statusFilter, supplierFilter, sortBy]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Dynamic Summary Metrics
  const totalCount = items.length;
  const lowStockCount = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.threshold).length;
  const inStockCount = items.filter((i) => i.currentStock > i.threshold).length;
  const outOfStockCount = items.filter((i) => i.currentStock === 0).length;

  // Category Tab Counts
  const ingredientsCount = items.filter((i) => i.subCategory === 'Ingredients').length;
  const packagingCount = items.filter((i) => i.subCategory === 'Packaging').length;
  const beveragesCount = items.filter((i) => i.subCategory === 'Beverages').length;
  const othersCount = items.filter((i) => i.subCategory === 'Others').length;

  // Select all checkbox
  const isAllSelected =
    paginatedItems.length > 0 && paginatedItems.every((it) => selectedItemIds.includes(it.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(paginatedItems.map((it) => it.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="admin-inventory-root">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="admin-inventory-toast" role="status">
          <Info size={16} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Search & Profile Toolbar */}
      <header className="inventory-topbar-strip" aria-label="Admin search and profile toolbar">
        <div className="inventory-top-search-wrap">
          <Search size={17} className="inventory-top-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="inventory-top-search-input"
            placeholder="Search ingredients, categories, or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search ingredients, categories, or suppliers"
          />
        </div>

        <div className="inventory-topbar-right">
          <button
            type="button"
            className="inventory-bell-btn"
            onClick={() => showToast('3 unread operational stock notifications (real-time service unconfigured).')}
            aria-label="Notifications (3 unread)"
          >
            <span className="bell-badge-indicator" aria-hidden="true">3</span>
            <span className="bell-dot" />
          </button>

          <div
            className="inventory-admin-badge"
            role="button"
            tabIndex={0}
            onClick={() => onNavigate?.('/profile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate?.('/profile');
              }
            }}
            style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          >
            <img
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&h=80&w=80"
              alt="Admin user avatar"
              className="inventory-admin-avatar"
            />
            <div className="inventory-admin-meta">
              <strong>Admin</strong>
              <small>PizzaDelight Admin</small>
            </div>
            <ChevronDown size={14} className="chevron-muted" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={`inventory-workspace-layout ${isDrawerOpen ? 'drawer-open' : 'drawer-closed'}`}>
        {/* Left / Main Workspace */}
        <section className="inventory-main-content">
          {/* Page Header */}
          <div className="inventory-page-header">
            <div className="header-titles">
              <h1 className="inventory-main-heading">Inventory Management</h1>
              <p className="inventory-subtitle">
                Track, update and manage all ingredients, packaging items and supplies.
              </p>
            </div>

            <div className="header-actions-group">
              <button
                type="button"
                className="button button-outline inventory-action-outline-btn"
                onClick={handleExportCSV}
              >
                <Download size={15} aria-hidden="true" />
                <span>Export</span>
              </button>

              <button
                type="button"
                className="button inventory-primary-add-btn"
                onClick={openAddDrawer}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards Grid */}
          <div className="inventory-summary-grid">
            {/* 1. Total Items */}
            <div className="inventory-summary-card">
              <div className="summary-icon-box total-icon" aria-hidden="true">
                <Package size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Total Items</span>
                <strong className="summary-value">{totalCount}</strong>
                <span className="summary-subtext positive">+3 this month</span>
              </div>
            </div>

            {/* 2. Low Stock */}
            <div className="inventory-summary-card">
              <div className="summary-icon-box low-stock-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Low Stock</span>
                <strong className="summary-value">{lowStockCount}</strong>
                <span className="summary-subtext warning">Need attention</span>
              </div>
            </div>

            {/* 3. In Stock */}
            <div className="inventory-summary-card">
              <div className="summary-icon-box in-stock-icon" aria-hidden="true">
                <Leaf size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">In Stock</span>
                <strong className="summary-value">{inStockCount}</strong>
                <span className="summary-subtext positive">All good</span>
              </div>
            </div>

            {/* 4. Out of Stock */}
            <div className="inventory-summary-card">
              <div className="summary-icon-box out-of-stock-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div className="summary-text-col">
                <span className="summary-label">Out of Stock</span>
                <strong className="summary-value">{outOfStockCount}</strong>
                <span className="summary-subtext danger">Replenish soon</span>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="inventory-category-tabs" role="tablist" aria-label="Inventory categories">
            {[
              { label: 'All Items', count: totalCount },
              { label: 'Ingredients', count: ingredientsCount },
              { label: 'Packaging', count: packagingCount },
              { label: 'Beverages', count: beveragesCount },
              { label: 'Others', count: othersCount },
            ].map((tab) => {
              const isActive = activeCategoryTab === tab.label;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategoryTab(tab.label);
                    setCurrentPage(1);
                  }}
                >
                  <span>{tab.label}</span>
                  <span className="tab-count-badge">({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Search and Filters Toolbar */}
          <div className="inventory-filter-toolbar">
            <div className="filter-search-box">
              <Search size={15} className="filter-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Filter items"
              />
            </div>

            <div className="filter-dropdowns-row">
              <div className="select-wrapper">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by category"
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Meat">Meat</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Condiments">Condiments</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Others">Others</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>

              <div className="select-wrapper">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by status"
                  className="filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>

              <div className="select-wrapper">
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Filter by supplier"
                  className="filter-select"
                >
                  <option value="All">All Suppliers</option>
                  <option value="FreshFarms Co.">FreshFarms Co.</option>
                  <option value="DairyFresh Ltd.">DairyFresh Ltd.</option>
                  <option value="BakerCraft">BakerCraft</option>
                  <option value="GreenLeaf Organic">GreenLeaf Organic</option>
                  <option value="MeatMasters">MeatMasters</option>
                  <option value="PackPro Ltd.">PackPro Ltd.</option>
                  <option value="PureOils Inc.">PureOils Inc.</option>
                  <option value="GlobalBev Co.">GlobalBev Co.</option>
                  <option value="SpiceWorks">SpiceWorks</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>

              <div className="select-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort items"
                  className="filter-select"
                >
                  <option value="name">Sort by: Name</option>
                  <option value="stockAsc">Sort by: Stock (Low to High)</option>
                  <option value="stockDesc">Sort by: Stock (High to Low)</option>
                  <option value="threshold">Sort by: Threshold</option>
                </select>
                <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Inventory Data Table */}
          <div className="inventory-table-container">
            <table className="inventory-data-table">
              <thead>
                <tr>
                  <th scope="col" className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all items on current page"
                      className="inventory-checkbox"
                    />
                  </th>
                  <th scope="col" className="col-item">Item</th>
                  <th scope="col" className="col-category">Category</th>
                  <th scope="col" className="col-stock">Current Stock</th>
                  <th scope="col" className="col-unit">Unit</th>
                  <th scope="col" className="col-threshold">Threshold</th>
                  <th scope="col" className="col-status">Status</th>
                  <th scope="col" className="col-date">Last Updated</th>
                  <th scope="col" className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-table-cell">
                      <p>No inventory items match your current search and filter criteria.</p>
                      <button
                        type="button"
                        className="button button-outline button-small"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('All');
                          setStatusFilter('All');
                          setSupplierFilter('All');
                          setActiveCategoryTab('All Items');
                        }}
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isEditing = selectedItem?.id === item.id && isDrawerOpen;

                    return (
                      <tr
                        key={item.id}
                        className={`${isSelected ? 'row-selected' : ''} ${isEditing ? 'row-editing' : ''}`}
                        onClick={() => openEditDrawer(item)}
                      >
                        <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            aria-label={`Select ${item.name}`}
                            className="inventory-checkbox"
                          />
                        </td>

                        <td className="col-item">
                          <div className="item-cell-layout">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="item-thumbnail"
                              loading="lazy"
                            />
                            <div className="item-title-group">
                              <strong className="item-title-text">{item.name}</strong>
                              <small className="item-subtext">{item.subCategory}</small>
                            </div>
                          </div>
                        </td>

                        <td className="col-category">
                          <span className="category-tag-text">{item.category}</span>
                        </td>

                        <td className="col-stock">
                          <strong
                            className={`stock-qty-text ${
                              item.currentStock === 0
                                ? 'qty-out'
                                : item.currentStock <= item.threshold
                                ? 'qty-low'
                                : 'qty-ok'
                            }`}
                          >
                            {item.currentStock}
                          </strong>
                        </td>

                        <td className="col-unit">
                          <span className="unit-text">{item.unit}</span>
                        </td>

                        <td className="col-threshold">
                          <span className="threshold-text">{item.threshold}</span>
                        </td>

                        <td className="col-status">
                          <span
                            className={`inventory-status-pill ${
                              item.status === 'In Stock'
                                ? 'in-stock'
                                : item.status === 'Low Stock'
                                ? 'low-stock'
                                : 'out-of-stock'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="col-date">
                          <span className="date-text">{item.lastUpdated}</span>
                        </td>

                        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="action-buttons-wrap">
                            <button
                              type="button"
                              className="action-icon-btn edit-icon-btn"
                              onClick={() => openEditDrawer(item)}
                              aria-label={`Edit ${item.name}`}
                              title="Edit item"
                            >
                              <Edit2 size={14} />
                            </button>

                            <div className="more-action-dropdown-container">
                              <button
                                type="button"
                                className="action-icon-btn more-icon-btn"
                                onClick={() =>
                                  setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)
                                }
                                aria-label="More actions"
                                title="More actions"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {openActionMenuId === item.id && (
                                <div className="action-context-menu" role="menu">
                                  <button
                                    type="button"
                                    className="menu-item-row"
                                    onClick={() => {
                                      openEditDrawer(item);
                                      setOpenActionMenuId(null);
                                    }}
                                  >
                                    <Edit2 size={13} />
                                    <span>Edit Item</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="menu-item-row"
                                    onClick={() => {
                                      const duplicate: InventoryItem = {
                                        ...item,
                                        id: `inv-${Date.now()}`,
                                        name: `${item.name} (Copy)`,
                                        sku: `${item.sku}-CP`,
                                      };
                                      setItems((prev) => [duplicate, ...prev]);
                                      setOpenActionMenuId(null);
                                      showToast(`Duplicated ${item.name} into local session.`);
                                    }}
                                  >
                                    <Copy size={13} />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="menu-item-row"
                                    onClick={() => {
                                      setItems((prev) =>
                                        prev.map((it) =>
                                          it.id === item.id ? { ...it, active: !it.active } : it
                                        )
                                      );
                                      setOpenActionMenuId(null);
                                      showToast(`Item ${item.active ? 'deactivated' : 'activated'} locally.`);
                                    }}
                                  >
                                    <Power size={13} />
                                    <span>{item.active ? 'Deactivate' : 'Activate'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <footer className="inventory-pagination-strip">
            <div className="pagination-count-label">
              Showing{' '}
              <strong>
                {filteredItems.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + itemsPerPage, filteredItems.length)}
              </strong>{' '}
              of <strong>{filteredItems.length}</strong> items
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="page-nav-btn prev-btn"
                disabled={currentPageClamped <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === currentPageClamped;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${isCurrent ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="page-nav-btn next-btn"
                disabled={currentPageClamped >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        </section>

        {/* Right Edit/Add Drawer */}
        {isDrawerOpen && (
          <aside className="inventory-edit-drawer" aria-label="Edit ingredient panel">
            {/* Drawer Header */}
            <div className="drawer-header-strip">
              <div className="drawer-title-group">
                <button
                  type="button"
                  className="drawer-back-btn"
                  onClick={closeDrawer}
                  aria-label="Close drawer"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="drawer-main-title">
                  {drawerMode === 'edit' ? 'Edit Ingredient' : 'Add Ingredient'}
                </h2>
              </div>

              <button
                type="button"
                className="drawer-close-btn"
                onClick={closeDrawer}
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Item Hero Header */}
            {drawerMode === 'edit' && selectedItem && (
              <div className="drawer-hero-card">
                <img
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  className="drawer-hero-img"
                />
                <div className="drawer-hero-text">
                  <h3 className="drawer-hero-name">{selectedItem.name}</h3>
                  <p className="drawer-hero-desc">{selectedItem.description}</p>
                </div>
              </div>
            )}

            {/* Drawer Internal Navigation Tabs */}
            <nav className="drawer-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'details'}
                className={`drawer-tab-btn ${drawerTab === 'details' ? 'active' : ''}`}
                onClick={() => setDrawerTab('details')}
              >
                Details
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'history'}
                className={`drawer-tab-btn ${drawerTab === 'history' ? 'active' : ''}`}
                onClick={() => setDrawerTab('history')}
              >
                Stock History
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'supplier'}
                className={`drawer-tab-btn ${drawerTab === 'supplier' ? 'active' : ''}`}
                onClick={() => setDrawerTab('supplier')}
              >
                Supplier Info
              </button>
            </nav>

            {/* Drawer Content Panes */}
            <div className="drawer-scrollable-body">
              {/* TAB 1: DETAILS TAB */}
              {drawerTab === 'details' && (
                <form onSubmit={handleSaveItem} className="drawer-form-layout">
                  {formError && (
                    <div className="drawer-error-banner" role="alert">
                      <AlertTriangle size={15} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Basic Info Fields */}
                  <div className="drawer-form-group">
                    <label className="drawer-label" htmlFor="inv-name">
                      Item Name <span className="required-star">*</span>
                    </label>
                    <input
                      id="inv-name"
                      type="text"
                      className="drawer-input-field"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Tomatoes"
                      required
                    />
                  </div>

                  <div className="drawer-form-group">
                    <label className="drawer-label" htmlFor="inv-cat">
                      Category <span className="required-star">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="inv-cat"
                        className="drawer-select-field"
                        value={formCategory}
                        onChange={(e) =>
                          setFormCategory(e.target.value as InventoryItem['category'])
                        }
                      >
                        <option value="Vegetables">Vegetables</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Herbs">Herbs</option>
                        <option value="Meat">Meat</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Condiments">Condiments</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Others">Others</option>
                      </select>
                      <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="drawer-form-group">
                    <label className="drawer-label" htmlFor="inv-desc">Description</label>
                    <textarea
                      id="inv-desc"
                      className="drawer-textarea-field"
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter description, storage instructions, or ingredients notes..."
                    />
                  </div>

                  <div className="drawer-two-col-row">
                    <div className="drawer-form-group">
                      <label className="drawer-label" htmlFor="inv-unit">
                        Unit <span className="required-star">*</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="inv-unit"
                          className="drawer-select-field"
                          value={formUnit}
                          onChange={(e) => setFormUnit(e.target.value)}
                        >
                          <option value="kg">Kilograms (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="pcs">Pieces (pcs)</option>
                          <option value="L">Litres (L)</option>
                          <option value="ml">Millilitres (ml)</option>
                          <option value="rolls">Rolls</option>
                        </select>
                        <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label" htmlFor="inv-sku">SKU</label>
                      <input
                        id="inv-sku"
                        type="text"
                        className="drawer-input-field"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="e.g. VEG-TOM-001"
                      />
                    </div>
                  </div>

                  {/* Section: Stock Information */}
                  <div className="drawer-fieldset-card">
                    <div className="fieldset-heading">
                      <Package size={16} className="fieldset-icon" aria-hidden="true" />
                      <strong>Stock Information</strong>
                    </div>

                    <div className="drawer-two-col-row">
                      <div className="drawer-form-group">
                        <label className="drawer-label" htmlFor="inv-stock">
                          Current Stock <span className="required-star">*</span>
                        </label>
                        <div className="input-with-unit-badge">
                          <input
                            id="inv-stock"
                            type="number"
                            min="0"
                            className="drawer-input-field"
                            value={formCurrentStock}
                            onChange={(e) => setFormCurrentStock(Number(e.target.value))}
                            required
                          />
                          <span className="unit-badge">{formUnit}</span>
                        </div>
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label" htmlFor="inv-threshold">
                          Threshold Level <span className="required-star">*</span>
                        </label>
                        <div className="input-with-unit-badge">
                          <input
                            id="inv-threshold"
                            type="number"
                            min="0"
                            className="drawer-input-field"
                            value={formThreshold}
                            onChange={(e) => setFormThreshold(Number(e.target.value))}
                            required
                          />
                          <span className="unit-badge">{formUnit}</span>
                        </div>
                      </div>
                    </div>

                    <label className="alert-checkbox-row">
                      <input
                        type="checkbox"
                        checked={formAlertOnLow}
                        onChange={(e) => setFormAlertOnLow(e.target.checked)}
                        className="inventory-checkbox"
                      />
                      <span>Get alerted when stock is low</span>
                    </label>
                  </div>

                  {/* Section: Supplier Information */}
                  <div className="drawer-fieldset-card">
                    <div className="fieldset-heading">
                      <User size={16} className="fieldset-icon" aria-hidden="true" />
                      <strong>Supplier Information</strong>
                    </div>

                    <div className="drawer-form-group">
                      <label className="drawer-label" htmlFor="inv-supplier">Supplier</label>
                      <div className="select-wrapper">
                        <select
                          id="inv-supplier"
                          className="drawer-select-field"
                          value={formSupplier}
                          onChange={(e) => setFormSupplier(e.target.value)}
                        >
                          <option value="FreshFarms Co.">FreshFarms Co.</option>
                          <option value="DairyFresh Ltd.">DairyFresh Ltd.</option>
                          <option value="BakerCraft">BakerCraft</option>
                          <option value="GreenLeaf Organic">GreenLeaf Organic</option>
                          <option value="MeatMasters">MeatMasters</option>
                          <option value="PackPro Ltd.">PackPro Ltd.</option>
                          <option value="PureOils Inc.">PureOils Inc.</option>
                          <option value="GlobalBev Co.">GlobalBev Co.</option>
                          <option value="SpiceWorks">SpiceWorks</option>
                        </select>
                        <ChevronDown size={14} className="select-chevron" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="drawer-two-col-row">
                      <div className="drawer-form-group">
                        <label className="drawer-label" htmlFor="inv-cost">Cost per Unit (₹)</label>
                        <input
                          id="inv-cost"
                          type="number"
                          step="0.01"
                          min="0"
                          className="drawer-input-field"
                          value={formCostPerUnit}
                          onChange={(e) => setFormCostPerUnit(Number(e.target.value))}
                        />
                      </div>

                      <div className="drawer-form-group">
                        <label className="drawer-label" htmlFor="inv-purchased">Last Purchased</label>
                        <div className="input-with-icon-badge">
                          <input
                            id="inv-purchased"
                            type="text"
                            className="drawer-input-field"
                            value={formLastPurchased}
                            onChange={(e) => setFormLastPurchased(e.target.value)}
                            placeholder="e.g. Sep 10, 2026"
                          />
                          <Calendar size={15} className="input-icon" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Status */}
                  <div className="drawer-fieldset-card">
                    <strong className="fieldset-subhead">Status</strong>
                    <div className="radio-group-row">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="item-active"
                          checked={formActive === true}
                          onChange={() => setFormActive(true)}
                        />
                        <span>Active</span>
                      </label>

                      <label className="radio-label">
                        <input
                          type="radio"
                          name="item-active"
                          checked={formActive === false}
                          onChange={() => setFormActive(false)}
                        />
                        <span>Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="drawer-actions-footer">
                    <button
                      type="button"
                      className="button button-outline drawer-cancel-btn"
                      onClick={closeDrawer}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="button drawer-submit-btn"
                    >
                      <Save size={15} aria-hidden="true" />
                      <span>{drawerMode === 'edit' ? 'Update Item' : 'Add Item'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: STOCK HISTORY TAB */}
              {drawerTab === 'history' && (
                <div className="drawer-history-pane">
                  <div className="history-info-callout">
                    <Clock size={16} aria-hidden="true" />
                    <div>
                      <strong>Audit Log (Session Preview)</strong>
                      <p>Historical inventory adjustments recorded during this local session.</p>
                    </div>
                  </div>

                  {selectedItem?.history && selectedItem.history.length > 0 ? (
                    <div className="history-timeline-list">
                      {selectedItem.history.map((entry, idx) => (
                        <div className="history-entry-card" key={idx}>
                          <div className="entry-header-row">
                            <span className="entry-date">{entry.date}</span>
                            <span
                              className={`entry-change-badge ${
                                entry.change.startsWith('+') ? 'gain' : 'loss'
                              }`}
                            >
                              {entry.change}
                            </span>
                          </div>
                          <p className="entry-reason">{entry.reason}</p>
                          <div className="entry-balance-strip">
                            <span>Prev: {entry.previousStock} {selectedItem.unit}</span>
                            <span className="sep-arrow">&rarr;</span>
                            <strong>New: {entry.newStock} {selectedItem.unit}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-history-state">
                      <RotateCcw size={28} />
                      <p>No recent adjustments logged for this ingredient.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUPPLIER INFO TAB */}
              {drawerTab === 'supplier' && (
                <div className="drawer-supplier-pane">
                  <div className="supplier-profile-card">
                    <div className="supplier-profile-header">
                      <div className="supplier-avatar-circle" aria-hidden="true">
                        <span>{formSupplier.charAt(0)}</span>
                      </div>
                      <div className="supplier-headline">
                        <strong className="supplier-name-text">{formSupplier}</strong>
                        <span className="supplier-status-badge">Approved Vendor</span>
                      </div>
                    </div>

                    <div className="supplier-details-grid">
                      <div className="supplier-kv-item">
                        <span className="kv-label">Cost per Unit</span>
                        <strong className="kv-val">₹{formCostPerUnit} / {formUnit}</strong>
                      </div>

                      <div className="supplier-kv-item">
                        <span className="kv-label">SKU Reference</span>
                        <strong className="kv-val">{formSku}</strong>
                      </div>

                      <div className="supplier-kv-item">
                        <span className="kv-label">Last Purchased</span>
                        <span className="kv-val">{formLastPurchased}</span>
                      </div>

                      <div className="supplier-kv-item">
                        <span className="kv-label">Min Order Qty</span>
                        <span className="kv-val">10 {formUnit}</span>
                      </div>

                      <div className="supplier-kv-item full-width">
                        <span className="kv-label">Delivery Lead Time</span>
                        <span className="kv-val">24–48 hours (Direct Cold Chain Dispatch)</span>
                      </div>
                    </div>

                    <div className="supplier-demo-notice">
                      <Info size={14} />
                      <span>Supplier profile preview &bull; Live procurement backend not connected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
