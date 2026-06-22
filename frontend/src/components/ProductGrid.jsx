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
          zepto: [],
          blinkit: []
        };
      }
      if (product.platform === 'instamart') {
        groups[key].instamart.push(product);
      } else if (product.platform === 'zepto') {
        groups[key].zepto.push(product);
      } else if (product.platform === 'blinkit') {
        groups[key].blinkit.push(product);
      }
    });
    
    const compared = [];
    const singles = [];

    Object.values(groups).forEach((group) => {
      const hasIM = group.instamart.length > 0;
      const hasZ = group.zepto.length > 0;
      const hasB = group.blinkit.length > 0;
      
      const matchCount = [hasIM, hasZ, hasB].filter(Boolean).length;
      
      if (matchCount >= 2) {
        compared.push(group);
        // If there are additional products in the compared group (e.g. index >= 1), add them to singles so they don't get lost
        if (group.instamart.length > 1) {
          singles.push(...group.instamart.slice(1));
        }
        if (group.zepto.length > 1) {
          singles.push(...group.zepto.slice(1));
        }
        if (group.blinkit.length > 1) {
          singles.push(...group.blinkit.slice(1));
        }
      } else {
        singles.push(...group.instamart, ...group.zepto, ...group.blinkit);
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
              const bProd = group.blinkit[0];

              // Find the cheapest matched product
              const activeProds = [imProd, zProd, bProd].filter(Boolean);
              const minPrice = Math.min(...activeProds.map(p => p.price));
              const maxPrice = Math.max(...activeProds.map(p => p.price));
              const cheapest = activeProds.find(p => p.price === minPrice);
              const diff = maxPrice - minPrice;

              let savingLabel = null;
              if (diff > 0) {
                const platformName = cheapest.platform === 'instamart' ? 'InstaMART' : cheapest.platform === 'zepto' ? 'Zepto' : 'Blinkit';
                savingLabel = `${platformName} is cheapest (save ₹${diff}!) 🏆`;
              } else {
                savingLabel = "Same price across platforms";
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
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--brand-dark)',
                      textTransform: 'capitalize',
                      margin: 0
                    }}>
                      {group.displayName} Comparison
                    </h3>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: diff > 0 ? '#10B981' : 'var(--text-muted)',
                      padding: '4px 10px',
                      backgroundColor: diff > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '8px',
                    }}>
                      {savingLabel}
                    </div>
                  </div>

                  {/* Side-by-side cards (3 columns) */}
                  <div className="compare-row-sides-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {/* Instamart Column */}
                    <div className="compare-col-instamart" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {imProd ? (
                        <ProductCard
                          product={imProd}
                          onAddToCompare={onAddToCompare}
                          onRemoveFromCompare={onRemoveFromCompare}
                          isAddedToCompare={compareList.some((item) => item.id === imProd.id)}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%', border: '2px dashed var(--border)', borderRadius: '16px', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, backgroundColor: '#FAFBFD' }}>
                          Not available
                        </div>
                      )}
                    </div>

                    {/* Zepto Column */}
                    <div className="compare-col-zepto" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {zProd ? (
                        <ProductCard
                          product={zProd}
                          onAddToCompare={onAddToCompare}
                          onRemoveFromCompare={onRemoveFromCompare}
                          isAddedToCompare={compareList.some((item) => item.id === zProd.id)}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%', border: '2px dashed var(--border)', borderRadius: '16px', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, backgroundColor: '#FAFBFD' }}>
                          Not available
                        </div>
                      )}
                    </div>

                    {/* Blinkit Column */}
                    <div className="compare-col-blinkit" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      {bProd ? (
                        <ProductCard
                          product={bProd}
                          onAddToCompare={onAddToCompare}
                          onRemoveFromCompare={onRemoveFromCompare}
                          isAddedToCompare={compareList.some((item) => item.id === bProd.id)}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%', border: '2px dashed var(--border)', borderRadius: '16px', padding: '24px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, backgroundColor: '#FAFBFD' }}>
                          Not available
                        </div>
                      )}
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
