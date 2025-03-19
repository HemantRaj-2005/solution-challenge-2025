import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { role, subjectsData } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { Prisma, Teacher, Subject } from "@prisma/client";
import Image from "next/image";

// Type definition for subjects with associated teachers
type SubjectList = Subject & { teachers: Teacher[] };

// Table column definitions
const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Teachers",
    accessor: "teachers",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Function to render each row in the table
const renderRow = (item: SubjectList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.teachers.map(teacher => teacher.name).join(",")}</td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            {/* Update and Delete modals for admin */}
            <FormModal table="subject" type="update" data={item} />
            <FormModal table="subject" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
);

// Main page component for displaying the subject list
const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page, ...queryParams } = searchParams;

  // Determine current page number from search parameters
  const p = page ? parseInt(page) : 1;

  // URL query parameters for filtering subjects
  const query: Prisma.SubjectWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            // Search query for filtering subjects by name (case-insensitive)
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // Fetch subjects and count using Prisma transactions
  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: {
        teachers: true, // Include associated teachers
      },
      take: ITEMS_PER_PAGE, // Pagination limit
      skip: ITEMS_PER_PAGE * (p - 1), // Offset based on current page
    }),
    prisma.subject.count({ where: query }), // Get total count for pagination
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP SECTION */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
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
            {/* Add Subject Modal (Only for Admin) */}
            {role === "admin" && <FormModal table="teacher" type="create" />}
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

export default SubjectListPage;
