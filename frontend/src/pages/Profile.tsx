import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services';
import { Order } from '../types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../utils/format';
import { Package, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        setOrders(res.data.data as Order[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} className="text-gray-400" />
            )}
          </div>
          <h2 className="font-bold text-gray-900 text-lg text-center">{user.full_name}</h2>
          <p className="text-gray-500 text-sm mb-6">{user.email}</p>
          
          <div className="w-full border-t pt-4">
            <button className="w-full text-left px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-md mb-2">
              Đơn hàng của tôi
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Package className="mr-2 text-primary-600" /> Lịch sử đơn hàng
          </h1>

          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
              <Link to="/products" className="text-primary-600 font-medium hover:underline">Bắt đầu mua sắm</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap justify-between items-center gap-2">
                    <div>
                      <span className="font-medium text-gray-900">Mã đơn: #{order.order_code}</span>
                      <span className="text-gray-500 text-sm ml-4">{formatDate(order.created_at)}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  {/* Order Items */}
                  <div className="p-4 divide-y">
                    {order.items?.map(item => (
                      <div key={item.id} className="py-2 flex items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded border flex-shrink-0">
                          {item.product_image && <img src={item.product_image} className="w-full h-full object-cover rounded" />}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                          <p className="text-sm text-gray-500">x{item.quantity} {item.variant_name ? `| ${item.variant_name}` : ''}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-gray-900">{formatCurrency(item.unit_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Footer */}
                  <div className="bg-gray-50 px-4 py-3 border-t flex justify-end items-center">
                    <span className="text-gray-600 mr-2">Tổng tiền:</span>
                    <span className="text-xl font-bold text-red-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
