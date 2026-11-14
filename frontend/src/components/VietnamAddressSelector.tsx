import React, { useEffect, useState } from 'react';
import {
  ALL_VIETNAM_PROVINCES,
  getDistrictsByProvince,
  getWardsByDistrict,
} from '../utils/vietnamAddressData';

interface VietnamAddressSelectorProps {
  province: string;
  district: string;
  ward: string;
  onChange: (address: { province: string; district: string; ward: string }) => void;
  disabled?: boolean;
}

export const VietnamAddressSelector: React.FC<VietnamAddressSelectorProps> = ({
  province,
  district,
  ward,
  onChange,
  disabled = false,
}) => {
  const [districts, setDistricts] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  useEffect(() => {
    if (province) {
      const dList = getDistrictsByProvince(province);
      setDistricts(dList);
      if (!dList.includes(district)) {
        onChange({ province, district: dList[0] || '', ward: '' });
      }
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [province]);

  useEffect(() => {
    if (province && district) {
      const wList = getWardsByDistrict(province, district);
      setWards(wList);
      if (!wList.includes(ward)) {
        onChange({ province, district, ward: wList[0] || '' });
      }
    } else {
      setWards([]);
    }
  }, [province, district]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProv = e.target.value;
    const dList = getDistrictsByProvince(newProv);
    const newDist = dList[0] || '';
    const wList = getWardsByDistrict(newProv, newDist);
    const newWard = wList[0] || '';
    onChange({ province: newProv, district: newDist, ward: newWard });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDist = e.target.value;
    const wList = getWardsByDistrict(province, newDist);
    const newWard = wList[0] || '';
    onChange({ province, district: newDist, ward: newWard });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ province, district, ward: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Tỉnh / Thành */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tỉnh / Thành phố *</label>
        <select
          value={province}
          onChange={handleProvinceChange}
          disabled={disabled}
          className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:ring-primary-500 focus:border-primary-500"
          required
        >
          <option value="">-- Chọn Tỉnh / Thành --</option>
          {ALL_VIETNAM_PROVINCES.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Quận / Huyện */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Quận / Huyện *</label>
        <select
          value={district}
          onChange={handleDistrictChange}
          disabled={disabled || !province}
          className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
          required
        >
          <option value="">-- Chọn Quận / Huyện --</option>
          {districts.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Phường / Xã */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phường / Xã *</label>
        <select
          value={ward}
          onChange={handleWardChange}
          disabled={disabled || !district}
          className="w-full border border-gray-300 p-2.5 rounded-lg text-sm bg-white focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
          required
        >
          <option value="">-- Chọn Phường / Xã --</option>
          {wards.map(w => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default VietnamAddressSelector;

