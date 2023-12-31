/* eslint-disable no-unused-expressions */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from "react-table";

// this is the column searching function
import { Link } from "react-router-dom";
import { columnFilter } from "../ColumnFilter/ColumnFilter";
import emptyFilter from "../ColumnFilter/EmptyFilter";
import GoToInput from "../Form/GoToInput";
import Pagination from "../Pagination/Pagination";

const ManageDataTable = () => {
  // select row state
  const [selectedRows, setSelectedRows] = useState([]);
  const [manageUploadData, setManageUploadData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/manageUploadData")
      .then((response) => {
        // Check if the response status is OK (200)
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        // Parse the JSON response
        return response.json();
      })
      .then((data) => {
        // Handle the JSON data here
        setManageUploadData(data);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }, []);

  // using the useMemo Hook to memoized the value.
  const data = React.useMemo(() => manageUploadData, [manageUploadData]);

  const uniqueNamesMap = new Map();
  const uniqueNamesArray = [];

  manageUploadData.forEach((item) => {
    const { userName, email } = item.user;
    const key = `${userName}-${email}`;

    if (!uniqueNamesMap.has(key)) {
      uniqueNamesMap.set(key, true);
      uniqueNamesArray.push({ userName, email });
    }
  });

  // using the useMemo Hook to memoized the value.
  const columns = React.useMemo(
    () => [
      {
        Header: "MSID",
        accessor: "id",
        Filter: columnFilter,
      },
      {
        Header: "Name",
        accessor: "user",
        Cell: ({ value, row }) => {
          return (
            <div>
              {/* normal view by default of user name cell */}
              <div className='edit_assign_to'>
                <div className='text-black'>
                  <strong> {value.userName}</strong>
                  <br />
                  {value.email}
                </div>
              </div>
            </div>
          );
        },
        Filter: columnFilter,
        // custom search filter for the assignTo (for name and mail)
        filter: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const user = row.values.user;
            return (
              user.userName.toLowerCase().includes(filterValue.toLowerCase()) ||
              user.email.toLowerCase().includes(filterValue.toLowerCase())
            );
          });
        },
      },
      {
        Header: "Role",
        accessor: "role",
        Filter: columnFilter,
      },
      {
        Header: "Filename",
        accessor: "fileName",
        Filter: columnFilter,
      },
      {
        Header: "Update Date And Time",
        accessor: "updateDateAndTime",
        Filter: columnFilter,
      },
      {
        Header: "Record Count",
        accessor: "recordCount",
        Filter: columnFilter,
      },
      {
        Header: "ACTIONS",
        accessor: "ACTIONS",
        Filter: emptyFilter,
        Cell: ({ row }) => {
          return (
            <div>
              <Link to=''>
                <button
                  onClick={() => handleSingleDataDelete(row?.original?.id)} // Define your edit action function
                  className='btn-edit'>
                  Delete
                </button>
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  // useTable functionalities from react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    gotoPage,
    setPageSize,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useFilters,
    useSortBy,
    usePagination
  );

  // Calculate the total number of pages based on data length and pageSize
  const totalPages = Math.ceil(data.length / pageSize);

  // Ensure that pageIndex is within bounds
  const normalizedPageIndex =
    pageIndex >= totalPages ? totalPages - 1 : pageIndex;

  // single data delete by userid
  const handleSingleDataDelete = (userid) => {
    fetch(`http://localhost:3001/manageUploadData/${userid}`, {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 200) {
          // console.log(`User with ID ${userid} has been deleted.`);
          setManageUploadData((prevData) =>
            prevData.filter((item) => item.id !== userid)
          );
        } else {
          console.error(`Failed to delete user with ID ${userid}.`);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  // batch delete
  const handleBatchDelete = () => {
    if (selectedRows.length > 0) {
      // return console.log(selectedRows);
      selectedRows.forEach((userid) => {
        fetch(`http://localhost:3001/manageUploadData/${userid}`, {
          method: "DELETE",
        })
          .then((response) => {
            if (response.status === 200) {
              // console.log(`User with ID ${userid} has been deleted.`);
              setManageUploadData((prevData) =>
                prevData.filter((item) => item.id !== userid)
              );
            } else {
              console.error(`Failed to delete user with ID ${userid}.`);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      });
    }
  };

  return (
    <div className='px-5 my-5 table-responsive'>
      {/* Table topbar */}
      <div className='d-flex align-items-center'>
        <div className='topBar_style mx-2 my-3 d-flex align-items-center py-3 px-4 d-flex justify-content-between'>
          {/* Go To Input */}
          <div className='my-2 text-lg-start text-md-center text-sm-center text-center text-white'>
            <GoToInput
              gotoPage={gotoPage}
              pageIndex={normalizedPageIndex} // Pass the pageIndex to GoToInput
              totalPages={totalPages} // Pass the totalPages to GoToInput
            />
          </div>

          <button
            className='btn btn-danger'
            onClick={() => handleBatchDelete()}>
            Delete all
          </button>
        </div>
      </div>

      <table className='table' {...getTableProps()}>
        {/* Mapping the data of header */}
        <thead>
          {headerGroups?.map((headerGroup, index) => (
            <tr key={index} {...headerGroup.getHeaderGroupProps()}>
              {/* select all */}
              <th>
                <input
                  type='checkbox'
                  checked={selectedRows.length === page.length}
                  onChange={() => {
                    if (selectedRows.length === page.length) {
                      setSelectedRows([]);
                    } else {
                      setSelectedRows(page.map((row) => row.original?.id));
                    }
                  }}
                />
              </th>
              {headerGroup?.headers?.map((column, index) => (
                <th
                  key={index}
                  scope='col'
                  {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render("Header")}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                  <div>
                    {column?.canFilter ? column?.render("Filter") : null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* Body */}
        <tbody {...getTableBodyProps()}>
          {page.map((row, index) => {
            prepareRow(row);
            return (
              // Mapping the table body row data
              <tr key={index} {...row.getRowProps()}>
                <td>
                  <input
                    type='checkbox'
                    checked={selectedRows.some(
                      (selectedRow) => selectedRow === row.original.id
                    )}
                    onChange={() => {
                      if (
                        selectedRows.some(
                          (selectedRow) => selectedRow === row.original.id
                        )
                      ) {
                        setSelectedRows(
                          selectedRows.filter(
                            (selectedRow) => selectedRow !== row.original.id
                          )
                        );
                      } else {
                        setSelectedRows([...selectedRows, row.original?.id]);
                      }
                    }}
                  />
                </td>
                {row.cells.map((cell, index) => (
                  <td key={index} {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className='d-flex align-items-center justify-content-center mt-5'>
        <Pagination
          totalPages={totalPages}
          currentPage={normalizedPageIndex}
          pageSize={pageSize}
          setPageSize={(newPageSize) => {
            setGlobalFilter(""); // Clear global filter when changing page size
            setPageSize(newPageSize);
          }}
          gotoPage={(newPageIndex) => {
            setGlobalFilter(""); // Clear global filter when changing pages
            pageIndex === newPageIndex || normalizedPageIndex === newPageIndex
              ? null
              : gotoPage(newPageIndex);
          }}
        />
      </div>
    </div>
  );
};

export default ManageDataTable;
