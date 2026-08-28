import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabels, selectLabels } from '../../store/labelsSlice';
import {
  selectFilterLabelIds,
  selectSortBy,
  selectSortDir,
  setFilterLabels,
  setSort,
} from '../../store/tasksSlice';
import type { SortDir, TaskSortBy } from '../../store/tasksSlice';

function FilterSortControls() {
  const dispatch = useAppDispatch();
  const labels = useAppSelector(selectLabels);
  const filterLabelIds = useAppSelector(selectFilterLabelIds);
  const sortBy = useAppSelector(selectSortBy);
  const sortDir = useAppSelector(selectSortDir);

  useEffect(() => {
    dispatch(fetchLabels());
  }, [dispatch]);

  function toggleFilterLabel(labelId: number) {
    if (filterLabelIds.includes(labelId)) {
      dispatch(setFilterLabels(filterLabelIds.filter((id) => id !== labelId)));
    } else {
      dispatch(setFilterLabels([...filterLabelIds, labelId]));
    }
  }

  function handleSortByChange(nextSortBy: TaskSortBy) {
    dispatch(setSort({ sortBy: nextSortBy, sortDir }));
  }

  function handleSortDirChange(nextSortDir: SortDir) {
    dispatch(setSort({ sortBy, sortDir: nextSortDir }));
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
      {labels.length > 0 && (
        <fieldset>
          <legend>Filter by labels</legend>
          {labels.map((label) => (
            <label key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={filterLabelIds.includes(label.id)}
                onChange={() => toggleFilterLabel(label.id)}
              />
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: '0.7rem',
                  height: '0.7rem',
                  borderRadius: '50%',
                  backgroundColor: label.color ?? '#ccc',
                  border: '1px solid rgba(0, 0, 0, 0.2)',
                }}
              />
              {label.name}
            </label>
          ))}
          {filterLabelIds.length > 0 && (
            <button type="button" onClick={() => dispatch(setFilterLabels([]))}>
              Clear filter
            </button>
          )}
        </fieldset>
      )}
      <div>
        <label htmlFor="task-sort-by">Sort by</label>{' '}
        <select
          id="task-sort-by"
          value={sortBy}
          onChange={(event) => handleSortByChange(event.target.value as TaskSortBy)}
        >
          <option value="completed">Completion</option>
          <option value="title">Title</option>
          <option value="label">Label</option>
        </select>{' '}
        <select
          id="task-sort-dir"
          aria-label="Sort direction"
          value={sortDir}
          onChange={(event) => handleSortDirChange(event.target.value as SortDir)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}

export default FilterSortControls;
