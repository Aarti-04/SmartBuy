import React from 'react';
import ProductCard from './ProductCard';

function ProductGrid({
  products,
  onAddToCompare,
  onRemoveFromCompare,
  compareList
}) {
  if (!products || products.length === 0) return null;

  return (
    <div className="product-grid" style={{ padding: '8px 0' }}>
      {products.map((product) => {
        const isAdded = compareList.some((item) => item.id === product.id);
        return (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCompare={onAddToCompare}
            onRemoveFromCompare={onRemoveFromCompare}
            isAddedToCompare={isAdded}
          />
        );
      })}
    </div>
  );
}

export default React.memo(ProductGrid);
