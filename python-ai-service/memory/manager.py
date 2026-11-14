"""
Memory Manager Module
Quản lý lưu trữ, cập nhật độ tin cậy (confidence), tổng hợp và xoá ký ức người dùng.
Tương tác trực tiếp với bảng `user_memories` và `user_preference_summary` trong MySQL.
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from database.mysql import get_db_connection


def get_user_memories(user_id: int) -> List[Dict[str, Any]]:
    """Lấy danh sách ký ức dài hạn của người dùng, sắp xếp theo độ tin cậy và ngày cập nhật."""
    if not user_id:
        return []
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, user_id, memory_type, memory_key, memory_value, confidence, source, created_at, updated_at
            FROM user_memories
            WHERE user_id = %s
            ORDER BY confidence DESC, updated_at DESC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows or []
    except Exception as e:
        print(f"[Error get_user_memories]: {e}")
        return []


def save_or_update_memory(user_id: int, memory_item: Dict[str, Any]) -> bool:
    """
    Lưu hoặc cập nhật một đơn vị ký ức cho người dùng.
    Quy tắc cập nhật confidence (Mục 6 & 15):
    - Nếu giá trị cũ giống giá trị mới: Tăng confidence (+0.15, max 1.0)
    - Nếu giá trị mới đổi sang thương hiệu/ngân sách khác: Cập nhật giá trị mới, reset confidence theo câu nói mới
    """
    if not user_id:
        return False

    memory_type = memory_item.get("memory_type")
    memory_key = memory_item.get("memory_key")
    memory_value = str(memory_item.get("memory_value", "")).strip()
    new_confidence = float(memory_item.get("confidence", 0.5))
    source = memory_item.get("source", "chat_extraction")

    if not memory_type or not memory_key or not memory_value:
        return False

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Kiểm tra xem memory_key này đã tồn tại chưa
        cursor.execute(
            """
            SELECT id, memory_value, confidence
            FROM user_memories
            WHERE user_id = %s AND memory_type = %s AND memory_key = %s
            """,
            (user_id, memory_type, memory_key)
        )
        existing = cursor.fetchone()

        if existing:
            existing_id = existing["id"]
            existing_value = str(existing["memory_value"]).strip()
            existing_conf = float(existing["confidence"] or 0.5)

            if existing_value.lower() == memory_value.lower():
                # Người dùng lặp lại sở thích cũ -> Tăng độ tin cậy
                updated_conf = min(1.0, existing_conf + 0.15)
                cursor.execute(
                    """
                    UPDATE user_memories
                    SET confidence = %s, updated_at = NOW(), source = %s
                    WHERE id = %s
                    """,
                    (updated_conf, source, existing_id)
                )
            else:
                # Người dùng đổi ý (Ví dụ chuyển từ Samsung -> iPhone)
                cursor.execute(
                    """
                    UPDATE user_memories
                    SET memory_value = %s, confidence = %s, updated_at = NOW(), source = %s
                    WHERE id = %s
                    """,
                    (memory_value, max(0.65, new_confidence), source, existing_id)
                )
        else:
            # Tạo mới memory
            cursor.execute(
                """
                INSERT INTO user_memories (user_id, memory_type, memory_key, memory_value, confidence, source, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """,
                (user_id, memory_type, memory_key, memory_value, new_confidence, source)
            )

        conn.commit()
        cursor.close()
        conn.close()

        # Tự động cập nhật user_preference_summary
        compile_and_update_preference_summary(user_id)
        return True
    except Exception as e:
        print(f"[Error save_or_update_memory]: {e}")
        return False


def delete_user_memory(user_id: int, memory_id: int) -> bool:
    """Xóa một memory cụ thể của người dùng (Bảo mật: Phải khớp user_id)."""
    if not user_id or not memory_id:
        return False
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM user_memories WHERE id = %s AND user_id = %s",
            (memory_id, user_id)
        )
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if affected > 0:
            compile_and_update_preference_summary(user_id)
            return True
        return False
    except Exception as e:
        print(f"[Error delete_user_memory]: {e}")
        return False


def delete_all_user_memories(user_id: int) -> bool:
    """Xóa toàn bộ memory và làm sạch preference summary của user."""
    if not user_id:
        return False
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_memories WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM user_preference_summary WHERE user_id = %s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[Error delete_all_user_memories]: {e}")
        return False


def update_user_memory(user_id: int, memory_id: int, memory_value: str, confidence: Optional[float] = None) -> bool:
    """Cho phép người dùng trực tiếp sửa một memory của mình."""
    if not user_id or not memory_id:
        return False
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if confidence is not None:
            cursor.execute(
                """
                UPDATE user_memories
                SET memory_value = %s, confidence = %s, updated_at = NOW()
                WHERE id = %s AND user_id = %s
                """,
                (memory_value, max(0.0, min(1.0, confidence)), memory_id, user_id)
            )
        else:
            cursor.execute(
                """
                UPDATE user_memories
                SET memory_value = %s, updated_at = NOW()
                WHERE id = %s AND user_id = %s
                """,
                (memory_value, memory_id, user_id)
            )
        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if affected > 0:
            compile_and_update_preference_summary(user_id)
            return True
        return False
    except Exception as e:
        print(f"[Error update_user_memory]: {e}")
        return False


def compile_and_update_preference_summary(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Tổng hợp tất cả các bản ghi trong user_memories thành một hồ sơ tổng thể
    trong bảng `user_preference_summary` (Mục 4).
    """
    if not user_id:
        return None

    memories = get_user_memories(user_id)
    if not memories:
        # Nếu không còn memory nào, xoá hoặc làm trống summary
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_preference_summary WHERE user_id = %s", (user_id,))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception:
            pass
        return None

    preferred_categories = []
    preferred_brands = []
    price_min = None
    price_max = None
    preferred_features = {}
    disliked_features = []

    for m in memories:
        m_type = m.get("memory_type")
        m_key = m.get("memory_key")
        val = m.get("memory_value")
        conf = float(m.get("confidence", 0.5))

        if m_type == "brand" and val not in preferred_brands:
            preferred_brands.append(val)
        elif m_type == "category" and val not in preferred_categories:
            preferred_categories.append(val)
        elif m_type == "budget":
            try:
                b_val = float(val)
                if "min" in m_key:
                    price_min = b_val
                else:
                    price_max = b_val
            except (ValueError, TypeError):
                pass
        elif m_type == "feature":
            feat_name = m_key.replace("feature_", "")
            preferred_features[feat_name] = val
        elif m_type == "dislike":
            disliked_features.append(val)

    # Sinh câu tóm tắt hồ sơ bằng tiếng Việt tự nhiên
    summary_parts = []
    if preferred_brands:
        summary_parts.append(f"Thương hiệu quan tâm: {', '.join(preferred_brands)}")
    if price_max:
        summary_parts.append(f"Ngân sách khoảng {price_max:,.0f} VNĐ".replace(",", "."))
    if preferred_features:
        feats_vn = []
        if "camera" in preferred_features:
            feats_vn.append("camera đẹp")
        if "gaming" in preferred_features:
            feats_vn.append("chơi game tốt")
        if "battery" in preferred_features:
            feats_vn.append("pin trâu")
        if "office" in preferred_features:
            feats_vn.append("mỏng nhẹ văn phòng")
        if feats_vn:
            summary_parts.append(f"Ưu tiên tính năng: {', '.join(feats_vn)}")
    if disliked_features:
        summary_parts.append(f"Muốn tránh: {', '.join(disliked_features)}")

    summary_text = " | ".join(summary_parts) if summary_parts else "Chưa có thông tin sở thích cụ thể"

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_preference_summary (
                user_id, preferred_categories, preferred_brands, price_min, price_max,
                preferred_features, disliked_features, favorite_products, summary, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                preferred_categories = VALUES(preferred_categories),
                preferred_brands = VALUES(preferred_brands),
                price_min = VALUES(price_min),
                price_max = VALUES(price_max),
                preferred_features = VALUES(preferred_features),
                disliked_features = VALUES(disliked_features),
                summary = VALUES(summary),
                updated_at = NOW()
            """,
            (
                user_id,
                json.dumps(preferred_categories, ensure_ascii=False),
                json.dumps(preferred_brands, ensure_ascii=False),
                price_min,
                price_max,
                json.dumps(preferred_features, ensure_ascii=False),
                json.dumps(disliked_features, ensure_ascii=False),
                json.dumps([], ensure_ascii=False),
                summary_text
            )
        )
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "user_id": user_id,
            "preferred_categories": preferred_categories,
            "preferred_brands": preferred_brands,
            "price_min": price_min,
            "price_max": price_max,
            "preferred_features": preferred_features,
            "disliked_features": disliked_features,
            "summary": summary_text
        }
    except Exception as e:
        print(f"[Error compile_and_update_preference_summary]: {e}")
        return None


def get_user_preference_summary(user_id: int) -> Optional[Dict[str, Any]]:
    """Lấy bản tóm tắt sở thích người dùng từ bảng `user_preference_summary`."""
    if not user_id:
        return None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT user_id, preferred_categories, preferred_brands, price_min, price_max,
                   preferred_features, disliked_features, favorite_products, summary, updated_at
            FROM user_preference_summary
            WHERE user_id = %s
            """,
            (user_id,)
        )
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            for json_field in ["preferred_categories", "preferred_brands", "preferred_features", "disliked_features", "favorite_products"]:
                if isinstance(row.get(json_field), str):
                    try:
                        row[json_field] = json.loads(row[json_field])
                    except Exception:
                        pass
            return row
        return None
    except Exception as e:
        print(f"[Error get_user_preference_summary]: {e}")
        return None
