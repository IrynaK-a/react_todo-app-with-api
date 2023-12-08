/* eslint-disable jsx-a11y/control-has-associated-label */

import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import cn from 'classnames';

import { TodoList } from './TodoList';
import { DispatchContext, StateContext } from './TodosProvider';
import { Footer } from './Footer';
import { ErrorMessage } from '../types/ErrorMessage';
import { USER_ID } from '../constants/userId';
import { createTodo, updateTodo } from '../api/todos';
import { TodoItem } from './TodoItem';

export const TodoApp = () => {
  const {
    todos,
    errorMessage,
    tempTodo,
  } = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const completedTodosCount = todos.filter(todo => todo.completed).length;

  const [title, setTitle] = useState('');
  let isCompletedAll = completedTodosCount === todos.length;

  const createTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const toggleAll = () => {
    isCompletedAll = !isCompletedAll;
    dispatch({
      type: 'shouldAllLoading',
      payload: true,
    });

    todos.forEach(async todo => {
      try {
        const updatedTodo = {
          ...todo,
          completed: isCompletedAll,
        };

        await updateTodo(updatedTodo);

        dispatch({
          type: 'updateTodo',
          payload: updatedTodo,
        });
        dispatch({
          type: 'shouldAllLoading',
          payload: false,
        });
      } catch (error) {
        dispatch({
          type: 'error',
          payload: ErrorMessage.Updating,
        });
        isCompletedAll = !isCompletedAll;
        dispatch({
          type: 'shouldAllLoading',
          payload: false,
        });
      }
    });
  };

  const createNewTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim()) {
      const newTodo = {
        title: title.trim(),
        userId: USER_ID,
        completed: false,
      };

      dispatch({
        type: 'createTempTodo',
        payload: { ...newTodo, id: 0 },
      });

      try {
        const responseNewTodo = await createTodo(newTodo);

        dispatch({
          type: 'createTodo',
          payload: responseNewTodo,
        });

        setTitle('');
      } catch (error) {
        dispatch({
          type: 'error',
          payload: ErrorMessage.Creating,
        });
      } finally {
        dispatch({
          type: 'createTempTodo',
          payload: null,
        });
      }
    } else {
      dispatch({
        type: 'error',
        payload: ErrorMessage.EmptyTitle,
      });
    }
  };

  const closeErrorMessage = () => {
    dispatch({ type: 'error', payload: ErrorMessage.None });
  };

  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => dispatch(
        { type: 'error', payload: ErrorMessage.None },
      ), 3000);
    }
  }, [errorMessage, dispatch]);

  useEffect(() => {
    titleRef.current?.focus();
  });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={cn(
              'todoapp__toggle-all',
              { active: isCompletedAll },
            )}
            data-cy="ToggleAllButton"
            onClick={toggleAll}
          />

          <form
            onSubmit={createNewTodo}
          >
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={createTitle}
              ref={titleRef}
              disabled={!!tempTodo}
            />
          </form>
        </header>

        {!!todos.length && (
          <>
            <TodoList />
            {tempTodo && <TodoItem todo={tempTodo} />}
            <Footer />
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={closeErrorMessage}
        />
        {errorMessage}
      </div>
    </div>
  );
};
