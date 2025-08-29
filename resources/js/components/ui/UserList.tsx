import { PageProps } from '@inertiajs/core';

type Props = PageProps & {
  users: {
    id: number;
    name: string;
    email: string;
  }[];
};

export default function UsersList({ users }: Props) {
  return (
    <div>
      <h1>Imported Users</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
