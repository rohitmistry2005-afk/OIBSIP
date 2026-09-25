import {
  getAdminOrderById,
  getNextOrderStatus,
  listAdminOrders,
  listInventory,
  updateInventoryItem,
  updateOrderStatus,
} from '../services/admin.service.js';

export async function getAdminOrders(req, res) {
  const orders = await listAdminOrders();
  res.json({ success: true, orders });
}

export async function getAdminOrder(req, res) {
  const order = await getAdminOrderById(req.params.id);
  res.json({
    success: true,
    order,
    nextStatus: getNextOrderStatus(order.orderStatus),
  });
}

export async function patchAdminOrderStatus(req, res) {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const order = await updateOrderStatus(req.params.id, status);
  res.json({
    success: true,
    message: 'Order status updated successfully',
    order,
    nextStatus: getNextOrderStatus(order.orderStatus),
  });
}

export async function getAdminInventory(req, res) {
  const inventory = await listInventory();
  res.json({ success: true, inventory });
}

export async function patchAdminInventory(req, res) {
  const inventory = await updateInventoryItem(req.params.id, req.body || {});
  res.json({
    success: true,
    message: 'Inventory updated successfully',
    inventory,
  });
}
