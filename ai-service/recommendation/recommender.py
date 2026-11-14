"""
Recommender Engine
Thực hiện xếp hạng và chọn lọc TOP 3 đến TOP 5 sản phẩm tối ưu nhất cho khách hàng.
Hỗ trợ chấm điểm cá nhân hóa đa tầng (Current Request, Memory, Behavior, Purchase History).
"""

from typing import Any, Dict, List, Optional
from .scoring import calculate_personalized_product_score

# Backward compatibility alias
calculate_product_score = calculate_personalized_product_score


def recommend_products(
    candidates: List[Dict[str, Any]],
    intent_data: Dict[str, Any],
    user_memories: Optional[List[Dict[str, Any]]] = None,
    preference_summary: Optional[Dict[str, Any]] = None,
    user_interactions: Optional[Dict[str, Any]] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Chấm điểm và sắp xếp các sản phẩm ứng viên dựa trên nhu cầu hiện tại và bộ nhớ cá nhân hóa.
    Trả về danh sách top_k sản phẩm cao điểm nhất.
    """
    if not candidates:
        return []

    scored_items = []
    for p in candidates:
        score = calculate_personalized_product_score(
            product=p,
            intent_data=intent_data,
            user_memories=user_memories,
            preference_summary=preference_summary,
            user_interactions=user_interactions
        )
        item_copy = dict(p)
        item_copy["recommendation_score"] = score
        scored_items.append(item_copy)

    # Sắp xếp giảm dần theo điểm số
    scored_items.sort(key=lambda x: x["recommendation_score"], reverse=True)

    # Lấy top_k (Top 3 - 5)
    return scored_items[:top_k]
