

const paginationStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    marginTop: '16px',
    borderTop: '1px solid #ddd',
  },
  info: {
    fontSize: '14px',
    color: '#666',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  button: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    color: '#333',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  buttonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  pageSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
}) {
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={paginationStyles.container}>
      <div style={paginationStyles.info} aria-live="polite">
        Showing {startIndex} to {endIndex} of {totalItems} items
      </div>

      <div style={paginationStyles.controls}>
        {onItemsPerPageChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="items-per-page" style={{ fontSize: '14px' }}>
              Items per page:
            </label>
            <select
              id="items-per-page"
              style={paginationStyles.pageSelect}
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              aria-label="Items per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <button
          style={{
            ...paginationStyles.button,
            ...(currentPage === 1 ? paginationStyles.buttonDisabled : {}),
          }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Page</span>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
              onPageChange(page);
            }}
            min="1"
            max={totalPages}
            style={{
              width: '50px',
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            aria-label="Go to page"
          />
          <span style={{ fontSize: '14px', color: '#666' }}>of {totalPages}</span>
        </div>

        <button
          style={{
            ...paginationStyles.button,
            ...(currentPage === totalPages ? paginationStyles.buttonDisabled : {}),
          }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
