const BrandArea = ({ brands = [] }) => {
  if (!brands.length) return null;
  return (
    <div className="dms-preview-brand-area" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 16 }}>
      {brands.map((brand, index) => (
        <img
          key={index}
          src={brand.image}
          alt={brand.alt || ''}
          style={{ height: 80, objectFit: 'contain' }}
        />
      ))}
    </div>
  );
};

export default BrandArea;
