import React from 'react';
import { useGetUserQuery, usePutUserMutation } from '../api/usersApi';
import { createLoader, withLoader } from '@ryfylke-react/rtk-query-loader';
import { Button, Checkbox, createStyles, Group, Radio, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Org, OrgValues, Role, RoleValues, User } from '../models/authUser';

const useStyles = createStyles(() => ({
  editPage: {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column',
  },
  userForm: {
    display: 'grid',
    gap: '1.25rem',
    ['@media (min-width: 35em)']: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
  },
}));

const editFormLoader = createLoader({
  useQueries: () => {
    const params = useParams();
    if (!params.userId) throw new Error('No user id provided');
    const user = useGetUserQuery(params.userId);
    return {
      queries: {
        user,
      },
    };
  },
  onLoading: () => <>Loading....</>,
});

const UserEditForm = withLoader((_, loader) => {
  const user = loader.queries.user.data;
  const [putUser, { isSuccess, isLoading }] = usePutUserMutation();

  const [organization, setOrganization] = React.useState(user.org);
  const [role, setRole] = React.useState(user.role);
  const [enabled, setEnabled] = React.useState(user.enabled);
  const { classes } = useStyles();
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
    validate: {
      firstName: (value) => (value.length < 2 ? 'First Name must have at least 2 characters' : null),
      lastName: (value) => (value.length < 2 ? 'Last Name must have at least 2 characters' : null),
    },
  });

  const handleSubmit = async (input: Omit<User, 'id' | 'org' | 'role' | 'enabled' | 'email'>) => {
    form.validate();
    const body: User = { ...input, id: user.id, org: organization, role: role, enabled, email: user.email };
    if (form.isValid()) {
      await putUser(body);
    }
  };

  if (isLoading) {
    return <>Saving...</>;
  }

  if (isSuccess) {
    return <Navigate to={'/users'} />;
  }

  return (
    <div className={classes.editPage}>
      <Title color={'white'} size={'h2'}>
        Edit Form
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <div className={classes.userForm}>
          <TextInput required withAsterisk label={'First Name'} {...form.getInputProps('firstName')} />
          <TextInput required withAsterisk label={'Last Name'} {...form.getInputProps('lastName')} />
          <TextInput label={'Email'} value={user.email} disabled />
          <Checkbox.Group
            orientation={'vertical'}
            defaultValue={[`${user.enabled}`]}
            label={'Enabled'}
            onChange={(v) => {
              if (v.length) {
                setEnabled(true);
              } else {
                setEnabled(false);
              }
            }}
          >
            <Checkbox value={`${user.enabled}`} label={enabled ? 'Enabled' : 'Disabled'} />
          </Checkbox.Group>
          <Radio.Group
            label={'Organization'}
            orientation={'vertical'}
            value={organization}
            onChange={(v: Org) => {
              setOrganization(v);
            }}
            withAsterisk
          >
            {OrgValues.map((org) => (
              <Radio value={org} label={org} key={org} />
            ))}
          </Radio.Group>
          <Radio.Group
            label={'Role'}
            orientation={'vertical'}
            value={role}
            onChange={(v: Role) => setRole(v)}
            withAsterisk
          >
            {RoleValues.map((role) => (
              <Radio value={role} label={role} key={role} />
            ))}
          </Radio.Group>
        </div>
        <Group mt={'sm'}>
          <Button type={'submit'}>Save</Button>
          <Button type={'button'} variant={'outline'} onClick={() => navigate('/users')}>
            Cancel
          </Button>
        </Group>
      </form>
    </div>
  );
}, editFormLoader);

export default UserEditForm;
