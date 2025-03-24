import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { classesData, role } from "@/lib/data";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Class, Prisma, Student, Teacher } from "@prisma/client";

// Type definition for class data with associated supervisor
type ClassList = Class & { supervisor: Teacher };

// Table column definitions
const columns = [
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Function to render each row in the table
const renderRow = (item: ClassList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">{item.name[0]}</td>
    <td className="hidden md:table-cell">{item.supervisor.name + " " + item.supervisor.surname}</td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            {/* Update and Delete modals for admin */}
            <FormModal table="class" type="update" data={item} />
            <FormModal table="class" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

// Main page component for displaying the class list
const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  // Determine current page number from search parameters
  const p = page ? parseInt(page) : 1;

  // URL query parameters for filtering classes
  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            // Filter by supervisor ID
            query.supervisorId = value;
            break;
          case "search":
            // Search query for filtering classes by name (case-insensitive)
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // Fetch classes and count using Prisma transactions
  const [data, count] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: {
        students: true, // Include associated students
      },
      take: ITEMS_PER_PAGE, // Pagination limit
      skip: ITEMS_PER_PAGE * (p - 1), // Offset based on current page
    }),
    prisma.class.count({ where: query }), // Get total count for pagination
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP SECTION */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search Input */}
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {/* Filter & Sort Buttons */}
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {/* Add Class Modal (Only for Admin) */}
            {role === "admin" && <FormModal table="class" type="create" />}
          </div>
        </div>
      </div>

      {/* TABLE LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />

      {/* PAGINATION COMPONENT */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ClassListPage;
