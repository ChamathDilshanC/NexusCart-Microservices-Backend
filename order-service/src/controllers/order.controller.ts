import { Request, Response } from 'express';
import Order from '../models/Order';
import axios from 'axios';

export const createOrder = async (req: any, res: Response) => {
  try {
    const { items, businessId, shippingAddress } = req.body;
    
    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    const order = new Order({
      userId: req.user._id,
      businessId,
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
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const getUserOrders = async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const getVendorOrders = async (req: any, res: Response) => {
  try {
    // Determine business ID via HTTP to business-service
    const businessUrl = process.env.BUSINESS_SERVICE_URL || 'http://127.0.0.1:5002';
    const response = await axios.get(`${businessUrl}/api/business/me`, {
      headers: { Authorization: req.header('Authorization') }
    });
    const businessId = response.data._id;

    if (!businessId) return res.status(404).json({ message: 'Business not found' });

    const orders = await Order.find({ businessId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error: any) {
    if (error.response?.status === 404) {
       return res.status(404).json({ message: 'No business profile found for this vendor' });
    }
    res.status(500).json({ message: 'Error fetching vendor orders' });
  }
};

export const updateOrderStatus = async (req: any, res: Response) => {
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
