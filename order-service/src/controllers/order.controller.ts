import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import axios from 'axios';

// Authenticated user: Create order
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingAddress } = req.body;
    
    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const order = new Order({
      userId: req.user._id,
      items,
      totalAmount,
      shippingAddress
    });

    await order.save();

    // Notify Notification Service asynchronously
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007';
    axios.post(`${notifUrl}/api/notifications/send`, {
      userId: req.user._id,
      type: 'ORDER_CREATED',
      payload: { orderId: order._id, totalAmount }
    }).catch(err => console.error('Failed to send notification', err.message));

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Error creating order', error: (error as Error).message });
  }
};

// Authenticated user: Get own orders
export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('getUserOrders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: (error as Error).message });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: (error as Error).message });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Notify status update
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5007';
    axios.post(`${notifUrl}/api/notifications/send`, {
      userId: order.userId,
      type: 'ORDER_UPDATED',
      payload: { orderId: order._id, status }
    }).catch(err => console.error('Failed to send notification', err.message));

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' });
  }
};
