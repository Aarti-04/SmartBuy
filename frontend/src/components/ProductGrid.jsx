import React, { useMemo } from 'react';
import ProductCard from './ProductCard';

function ProductGrid({
  products,
  onAddToCompare,
  onRemoveFromCompare,
  compareList
}) {
  const { comparedGroups, singleProducts } = useMemo(() => {
    if (!products) return { comparedGroups: [], singleProducts: [] };
    
    // Group by first 3 words of normalized name
    const groups = {};
    products.forEach((product) => {
      const words = product.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .join(' ');
      const key = words || 'other';
      if (!groups[key]) {
        groups[key] = {
          key,
          displayName: product.name.split(' ').slice(0, 3).join(' '),
          instamart: [],
          zepto: []
        };
      }
      if (product.platform === 'instamart') {
        groups[key].instamart.push(product);
      } else if (product.platform === 'zepto') {
        groups[key].zepto.push(product);
      }
    });
    
    const compared = [];
    const singles = [];

    Object.values(groups).forEach((group) => {
      if (group.instamart.length > 0 && group.zepto.length > 0) {
        compared.push(group);
        // If there are additional products in the compared group (e.g. index >= 1), add them to singles so they don't get lost
        if (group.instamart.length > 1) {
          singles.push(...group.instamart.slice(1));
        }
        if (group.zepto.length > 1) {
          singles.push(...group.zepto.slice(1));
        }
      } else {
        singles.push(...group.instamart, ...group.zepto);
      }
    });
    
    return { comparedGroups: compared, singleProducts: singles };
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="product-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Direct Comparisons Section */}
      {comparedGroups.length > 0 && (
        <div className="compared-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--brand-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 10px 0',
            borderBottom: '2px solid var(--brand-accent)',
            paddingBottom: '8px',
            width: 'fit-content'
          }}>
            <span>⚖️</span> Direct Price Comparisons
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: 'var(--brand-accent)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: '4px'
            }}>{comparedGroups.length} Match{comparedGroups.length > 1 ? 'es' : ''}</span>
          </h2>

          <div className="compare-view-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {comparedGroups.map((group) => {
              const imProd = group.instamart[0];
              const zProd = group.zepto[0];

              // Calculate saving label
              let savingLabel = null;
              let savingColor = 'var(--text-muted)';
              const diff = Math.abs(imProd.price - zProd.price);
              if (diff > 0) {
                const cheaperPlatform = imProd.price < zProd.price ? 'Swiggy Instamart' : 'Zepto';
                savingLabel = `You save ₹${diff} on ${cheaperPlatform}! 🏆`;
                savingColor = '#10B981'; // Green for savings
              } else {
                savingLabel = "Same price on both platforms";
                savingColor = 'var(--text-muted)';
              }

              return (
                <div
                  key={group.key}
                  className="compare-row-card"
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Group Header */}
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--brand-dark)',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    textTransform: 'capitalize'
                  }}>
                    {group.displayName} Comparison
                  </h3>

                  {/* Side-by-side cards */}
                  <div className="compare-row-sides">
                    {/* Instamart Column */}
                    <div className="compare-col-instamart" style={{ display: 'flex', justifyContent: 'center' }}>
                      <ProductCard
                        product={imProd}
                        onAddToCompare={onAddToCompare}
                        onRemoveFromCompare={onRemoveFromCompare}
                        isAddedToCompare={compareList.some((item) => item.id === imProd.id)}
                      />
                    </div>

                    {/* Savings / Middle Connector */}
                    <div className="compare-col-savings" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '160px',
                      textAlign: 'center',
                      padding: '10px'
                    }}>
                      <span style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</span>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: savingColor,
                        padding: '6px 12px',
                        backgroundColor: savingColor === '#10B981' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '8px',
                        lineHeight: '1.4'
                      }}>
                        {savingLabel}
                      </div>
                    </div>

                    {/* Zepto Column */}
                    <div className="compare-col-zepto" style={{ display: 'flex', justifyContent: 'center' }}>
                      <ProductCard
                        product={zProd}
                        onAddToCompare={onAddToCompare}
                        onRemoveFromCompare={onRemoveFromCompare}
                        isAddedToCompare={compareList.some((item) => item.id === zProd.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Single-Platform Offers Section */}
      {singleProducts.length > 0 && (
        <div className="single-products-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--brand-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 10px 0',
            borderBottom: '2px solid #9CA3AF',
            paddingBottom: '8px',
            width: 'fit-content'
          }}>
            <span>📦</span> Single-Platform Offers
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#6B7280',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: '4px'
            }}>{singleProducts.length} Item{singleProducts.length > 1 ? 's' : ''}</span>
          </h2>

          <div className="product-grid" style={{ padding: '8px 0' }}>
            {singleProducts.map((product) => {
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
        </div>
      )}

    </div>
  );
}

export default React.memo(ProductGrid);
