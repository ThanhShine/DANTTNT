/**
 * Dữ liệu hành chính 3 cấp Việt Nam (Tỉnh/Thành → Quận/Huyện → Phường/Xã)
 * và hàm tính toán phí vận chuyển linh hoạt
 */

export interface AdministrativeDivision {
  province: string;
  districts: {
    district: string;
    wards: string[];
  }[];
}

export const VIETNAM_PROVINCES_DATA: AdministrativeDivision[] = [
  {
    province: 'TP. Hồ Chí Minh',
    districts: [
      { district: 'Quận 1', wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Tân Định', 'Phường Phạm Ngũ Lão'] },
      { district: 'Quận 3', wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5'] },
      { district: 'Quận 5', wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 10', 'Phường 12', 'Phường 14'] },
      { district: 'Quận 7', wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Phú Mỹ', 'Phường Tân Thuận Đông'] },
      { district: 'Quận 10', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 6', 'Phường 12', 'Phường 15'] },
      { district: 'Quận Bình Thạnh', wards: ['Phường 1', 'Phường 2', 'Phường 12', 'Phường 19', 'Phường 25', 'Phường 26'] },
      { district: 'Quận Tân Bình', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 12', 'Phường 15'] },
      { district: 'Quận Gò Vấp', wards: ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 8', 'Phường 11', 'Phường 16'] },
      { district: 'TP. Thủ Đức', wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Linh Trung', 'Phường Hiệp Phú', 'Phường Trường Thọ'] },
    ],
  },
  {
    province: 'Hà Nội',
    districts: [
      { district: 'Quận Hoàn Kiếm', wards: ['Phường Hàng Bạc', 'Phường Hàng Gai', 'Phường Hàng Bông', 'Phường Tràng Tiền', 'Phường Lý Thái Tổ'] },
      { district: 'Quận Ba Đình', wards: ['Phường Kim Mã', 'Phường Đội Cấn', 'Phường Liễu Giai', 'Phường Giảng Võ', 'Phường Điện Biên'] },
      { district: 'Quận Đống Đa', wards: ['Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Cát Linh', 'Phường Văn Miếu', 'Phường Trung Tự'] },
      { district: 'Quận Cầu Giấy', wards: ['Phường Dịch Vọng', 'Phường Nghĩa Đô', 'Phường Quan Hoa', 'Phường Mai Dịch', 'Phường Trung Hòa'] },
      { district: 'Quận Hai Bà Trưng', wards: ['Phường Bách Khoa', 'Phường Bạch Đằng', 'Phường Đồng Tâm', 'Phường Lê Đại Hành'] },
      { district: 'Quận Tây Hồ', wards: ['Phường Bưởi', 'Phường Nhật Tân', 'Phường Quảng An', 'Phường Xuân La', 'Phường Yên Phụ'] },
      { district: 'Quận Thanh Xuân', wards: ['Phường Hạ Đình', 'Phường Khương Mai', 'Phường Nhân Chính', 'Phường Thanh Xuân Bắc'] },
      { district: 'Quận Nam Từ Liêm', wards: ['Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Mễ Trì', 'Phường Trung Văn'] },
    ],
  },
  {
    province: 'Đà Nẵng',
    districts: [
      { district: 'Quận Hải Châu', wards: ['Phường Thạch Thang', 'Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'] },
      { district: 'Quận Thanh Khê', wards: ['Phường Vĩnh Trung', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Chính Gián', 'Phường An Khê'] },
      { district: 'Quận Sơn Trà', wards: ['Phường An Hải Bắc', 'Phường An Hải Tây', 'Phường Phước Mỹ', 'Phường Thọ Quang'] },
      { district: 'Quận Ngũ Hành Sơn', wards: ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Hải', 'Phường Hòa Quý'] },
      { district: 'Quận Liên Chiểu', wards: ['Phường Hòa Minh', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Hiệp Bắc'] },
      { district: 'Quận Cẩm Lệ', wards: ['Phường Khuê Trung', 'Phường Hòa Phát', 'Phường Hòa An', 'Phường Hòa Thọ Đông'] },
    ],
  },
  {
    province: 'Hải Phòng',
    districts: [
      { district: 'Quận Hồng Bàng', wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu'] },
      { district: 'Quận Ngô Quyền', wards: ['Phường Cầu Đất', 'Phường Lạc Viên', 'Phường Máy Tơ'] },
      { district: 'Quận Lê Chân', wards: ['Phường An Biên', 'Phường Cát Dài', 'Phường Dư Hàng'] },
    ],
  },
  {
    province: 'Cần Thơ',
    districts: [
      { district: 'Quận Ninh Kiều', wards: ['Phường Tân An', 'Phường An Cư', 'Phường Xuân Khánh', 'Phường Hưng Lợi'] },
      { district: 'Quận Cái Răng', wards: ['Phường Lê Bình', 'Phường Hưng Phú', 'Phường Hưng Thạnh'] },
      { district: 'Quận Bình Thủy', wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường Trà Nóc'] },
    ],
  },
  {
    province: 'Bình Dương',
    districts: [
      { district: 'TP. Thủ Dầu Một', wards: ['Phường Phú Hòa', 'Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa'] },
      { district: 'TP. Thuận An', wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Bình Hòa'] },
      { district: 'TP. Dĩ An', wards: ['Phường Dĩ An', 'Phường Tân Đông Hiệp', 'Phường Đông Hòa'] },
    ],
  },
  {
    province: 'Đồng Nai',
    districts: [
      { district: 'TP. Biên Hòa', wards: ['Phường Quyết Thắng', 'Phường Tân Phong', 'Phường Thống Nhất', 'Phường Trảng Dài'] },
      { district: 'TP. Long Khánh', wards: ['Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa'] },
    ],
  },
  {
    province: 'Quảng Nam',
    districts: [
      { district: 'TP. Tam Kỳ', wards: ['Phường An Mỹ', 'Phường An Xuân', 'Phường Tân Thạnh'] },
      { district: 'TP. Hội An', wards: ['Phường Minh An', 'Phường Cẩm Phô', 'Phường Sơn Phong'] },
    ],
  },
  {
    province: 'Thừa Thiên Huế',
    districts: [
      { district: 'TP. Huế', wards: ['Phường Vĩnh Ninh', 'Phường Phú Nhuận', 'Phường Thuận Lộc', 'Phường Thuận Thành'] },
    ],
  },
  {
    province: 'Khánh Hòa',
    districts: [
      { district: 'TP. Nha Trang', wards: ['Phường Lộc Thọ', 'Phường Phước Hải', 'Phường Vĩnh Hải', 'Phường Tân Lập'] },
    ],
  },
  {
    province: 'Lâm Đồng',
    districts: [
      { district: 'TP. Đà Lạt', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 8', 'Phường 10'] },
    ],
  },
  {
    province: 'Bà Rịa - Vũng Tàu',
    districts: [
      { district: 'TP. Vũng Tàu', wards: ['Phường 1', 'Phường 2', 'Phường Thắng Tam', 'Phường Nguyễn An Ninh'] },
    ],
  },
];

// Danh sách tất cả 63 tỉnh thành Việt Nam
export const ALL_VIETNAM_PROVINCES: string[] = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
  'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
  'Cần Thơ', 'Cao Bằng', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
  'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
  'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
  'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
  'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
  'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh',
  'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

/**
 * Lấy danh sách quận huyện theo tỉnh thành
 */
export function getDistrictsByProvince(provinceName: string): string[] {
  const match = VIETNAM_PROVINCES_DATA.find(p => p.province === provinceName);
  if (match) {
    return match.districts.map(d => d.district);
  }
  return [
    'Quận / Huyện Trung tâm',
    'Thành phố / Thị xã',
    'Huyện Ngoại thành 1',
    'Huyện Ngoại thành 2',
  ];
}

/**
 * Lấy danh sách phường xã theo quận huyện
 */
export function getWardsByDistrict(provinceName: string, districtName: string): string[] {
  const prov = VIETNAM_PROVINCES_DATA.find(p => p.province === provinceName);
  if (prov) {
    const dist = prov.districts.find(d => d.district === districtName);
    if (dist && dist.wards && dist.wards.length > 0) {
      return dist.wards;
    }
  }
  return [
    'Phường 1',
    'Phường 2',
    'Phường Trung tâm',
    'Thị trấn',
    'Xã Trung tâm',
    'Xã Nông thôn',
  ];
}

/**
 * Tính toán phí vận chuyển linh hoạt
 * @param subtotal Tổng tiền hàng
 * @param province Tỉnh thành giao hàng
 * @param isFreeShipCoupon Đã áp mã Freeship
 */
export function calculateShippingFee(
  subtotal: number,
  province?: string,
  isFreeShipCoupon = false
): { shippingFee: number; isFree: boolean; message: string } {
  if (isFreeShipCoupon) {
    return { shippingFee: 0, isFree: true, message: 'Miễn phí (Đã áp mã Freeship)' };
  }

  // Đơn hàng từ 500.000đ trở lên được miễn phí ship toàn quốc
  if (subtotal >= 500000) {
    return { shippingFee: 0, isFree: true, message: 'Miễn phí (Đơn hàng từ 500.000đ)' };
  }

  // Khu vực thành phố lớn: 25.000đ
  const majorCities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];
  if (province && majorCities.includes(province)) {
    return { shippingFee: 25000, isFree: false, message: '25.000đ (Nội thành)' };
  }

  // Khu vực khác: 35.000đ
  return { shippingFee: 35000, isFree: false, message: '35.000đ (Tiêu chuẩn)' };
}
